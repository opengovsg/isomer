import type {
  CollectionPagePageProps,
  IsomerSchema,
} from "@opengovsg/isomer-components"
import {
  COLLECTION_PAGE_DEFAULT_SORT_BY,
  COLLECTION_PAGE_DEFAULT_SORT_DIRECTION,
  getLayoutMetadataSchema,
  ISOMER_USABLE_PAGE_LAYOUTS,
  schema,
} from "@opengovsg/isomer-components"
import { TRPCError } from "@trpc/server"
import {
  AuditLogEvent,
  ResourceState,
  ResourceType,
} from "~prisma/generated/generatedEnums"
import { format, isBefore } from "date-fns"
import _, { get, isEmpty, isEqual } from "lodash"

import { INDEX_PAGE_PERMALINK } from "~/constants/sitemap"
import {
  sendCancelSchedulePageEmail,
  sendScheduledPageEmail,
} from "~/features/mail/service"
import {
  getIsScheduledPublishingEnabledForSite,
  IS_SINGPASS_ENABLED_FEATURE_KEY,
} from "~/lib/growthbook"
import {
  basePageSchema,
  createIndexPageSchema,
  createPageSchema,
  getRootPageSchema,
  listPagesSchema,
  pageSettingsSchema,
  publishPageSchema,
  readPageOutputSchema,
  reorderBlobSchema,
  updatePageBlobSchema,
  updatePageMetaSchema,
} from "~/schemas/page"
import { scheduledPublishServerSchema } from "~/schemas/schedule"
import { protectedProcedure, router } from "~/server/trpc"
import { ajv } from "~/utils/ajv"
import { safeJsonParse } from "~/utils/safeJsonParse"
import { logResourceEvent } from "../audit/audit.service"
import { alertPublishWhenSingpassDisabled } from "../auth/email/email.service"
import { db, jsonb, sql } from "../database"
import { PG_ERROR_CODES } from "../database/constants"
import { bulkValidateUserPermissionsForResources } from "../permissions/permissions.service"
import {
  getBlobOfResource,
  getFooter,
  getFullPageById,
  getNavBar,
  getPageById,
  getResourceFullPermalink,
  getResourcePermalinkTree,
  publishPageResource,
  publishResource,
  updateBlobById,
  updatePageById,
} from "../resource/resource.service"
import { getSiteConfig } from "../site/site.service"
import {
  createDefaultPage,
  createFolderIndexPage,
  schedulePublishResource,
  unschedulePublishResource,
} from "./page.service"

const schemaValidator = ajv.compile<IsomerSchema>(schema)

// TODO: Need to do validation like checking for existence of the page
// and whether the user has write-access to said page: replace protectorProcedure in this with the new procedure
const validatedPageProcedure = protectedProcedure.use(
  async ({ next, getRawInput }) => {
    const rawInput = await getRawInput()

    if (
      typeof rawInput === "object" &&
      rawInput !== null &&
      "content" in rawInput
    ) {
      // NOTE: content will be the entire page schema for now...
      if (!schemaValidator(safeJsonParse(rawInput.content as string))) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Schema validation failed.",
          cause: schemaValidator.errors,
        })
      }
    } else {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Missing request parameters.",
      })
    }

    return next()
  },
)

export const pageRouter = router({
  list: protectedProcedure
    .input(listPagesSchema)
    .query(async ({ ctx, input: { siteId, resourceId } }) => {
      await bulkValidateUserPermissionsForResources({
        siteId,
        action: "read",
        userId: ctx.user.id,
      })

      let query = db
        .selectFrom("Resource")
        .where("Resource.siteId", "=", siteId)

      if (resourceId) {
        query = query.where("Resource.parentId", "=", String(resourceId))
      }
      return query
        .select([
          "Resource.id",
          "Resource.permalink",
          "Resource.title",
          "Resource.publishedVersionId",
          "Resource.draftBlobId",
          "Resource.type",
        ])
        .execute()
    }),

  getCategories: protectedProcedure
    .input(basePageSchema)
    .query(async ({ ctx, input: { pageId, siteId } }) => {
      await bulkValidateUserPermissionsForResources({
        siteId,
        action: "read",
        userId: ctx.user.id,
      })

      const { parentId } = await db
        .selectFrom("Resource")
        .where("siteId", "=", siteId)
        .where("id", "=", String(pageId))
        .select("parentId")
        .executeTakeFirstOrThrow()

      const blobs = await db
        .selectFrom("Resource as r")
        .leftJoin("Blob as b", "r.draftBlobId", "b.id")
        .leftJoin("Version as v", "r.publishedVersionId", "v.id")
        .leftJoin("Blob as vb", "v.blobId", "vb.id")
        .where("r.siteId", "=", siteId)
        .where("r.parentId", "=", String(parentId))
        .select((eb) => {
          return eb.fn
            .coalesce(
              sql<string>`b.content->'page'->>'category'`,
              sql<string>`vb.content->'page'->>'category'`,
            )
            .as("category")
        })
        .distinct()
        .execute()

      const categories = blobs
        .map((blob) => blob.category)
        .filter((c) => !!c && !!c.trim())

      return {
        categories,
      }
    }),

  readPage: protectedProcedure
    .input(basePageSchema)
    .output(readPageOutputSchema)
    .query(async ({ ctx, input: { pageId, siteId } }) => {
      await bulkValidateUserPermissionsForResources({
        siteId,
        action: "read",
        userId: ctx.user.id,
      })

      const retrievedPage = await getPageById(db, {
        resourceId: pageId,
        siteId,
      })

      if (!retrievedPage) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Resource not found",
        })
      }

      return retrievedPage
    }),

  readPageAndBlob: protectedProcedure
    .input(basePageSchema)
    .query(async ({ ctx, input: { pageId, siteId } }) => {
      await bulkValidateUserPermissionsForResources({
        siteId,
        action: "read",
        userId: ctx.user.id,
      })

      return db.transaction().execute(async (tx) => {
        const page = await getFullPageById(tx, { resourceId: pageId, siteId })
        if (!page) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Resource not found",
          })
        }

        const { title, type, permalink, content, updatedAt } = page

        if (
          type !== ResourceType.Page &&
          type !== ResourceType.CollectionPage &&
          type !== ResourceType.RootPage &&
          type !== ResourceType.IndexPage &&
          type !== ResourceType.FolderMeta &&
          type !== ResourceType.CollectionMeta
        ) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "The specified resource could not be found",
          })
        }

        const siteMeta = await getSiteConfig(tx, siteId)
        const navbar = await getNavBar(tx, siteId)
        const footer = await getFooter(tx, siteId)

        return {
          permalink,
          navbar,
          footer,
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore type instantiation is excessively deep and possibly infinite
          content,
          title,
          type,
          updatedAt,
          ...siteMeta,
        }
      })
    }),

  reorderBlock: protectedProcedure
    .input(reorderBlobSchema)
    .mutation(async ({ ctx, input: { pageId, from, to, blocks, siteId } }) => {
      await bulkValidateUserPermissionsForResources({
        siteId,
        action: "update",
        userId: ctx.user.id,
      })

      const by = await db
        .selectFrom("User")
        .where("id", "=", ctx.user.id)
        .selectAll()
        .executeTakeFirstOrThrow(
          () =>
            new TRPCError({
              code: "BAD_REQUEST",
              message: "Please ensure that you are authenticated",
            }),
        )

      // NOTE: we have to check against the page's content that we retrieve from db
      // we adopt a strict check such that we allow the update iff the checksum is the same
      return db.transaction().execute(async (tx) => {
        const fullPage = await getFullPageById(tx, {
          resourceId: pageId,
          siteId,
        })
        if (!fullPage?.content) {
          // TODO: we should probably ping on call
          throw new TRPCError({
            code: "NOT_FOUND",
            message:
              "Unable to load content for the requested page, please contact Isomer Support",
          })
        }

        const actualBlocks = fullPage.content.content

        if (!isEqual(blocks, actualBlocks)) {
          throw new TRPCError({
            code: "CONFLICT",
            message:
              "Someone on your team has changed this page, refresh the page and try again",
          })
        }

        if (
          from >= actualBlocks.length ||
          to >= actualBlocks.length ||
          from < 0 ||
          to < 0
        ) {
          // NOTE: If this happens, this indicates that either our dnd libary on our frontend has a
          // bug or someone is trying to mess with our frontend
          throw new TRPCError({ code: "UNPROCESSABLE_CONTENT" })
        }

        const [movedBlock] = actualBlocks.splice(from, 1)
        if (!movedBlock) return blocks
        if (!fullPage.draftBlobId && !fullPage.publishedVersionId) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Please ensure that you have selected a valid page",
          })
        }

        // Insert at destination index
        actualBlocks.splice(to, 0, movedBlock)

        const oldBlob = await getBlobOfResource({
          db: tx,
          resourceId: String(pageId),
        })
        const updatedBlob = await updateBlobById(tx, {
          pageId,
          content: { ...fullPage.content, content: actualBlocks },
          siteId,
        })
        await logResourceEvent(tx, {
          siteId,
          eventType: AuditLogEvent.ResourceUpdate,
          delta: {
            before: {
              blob: oldBlob,
              resource: fullPage,
            },
            after: { blob: updatedBlob, resource: fullPage },
          },
          by,
        })

        // NOTE: user given content and db state is the same at this point
        return actualBlocks
      })
    }),
  schedulePage: protectedProcedure
    .input(scheduledPublishServerSchema)
    .mutation(async ({ ctx, input: { scheduledAt, siteId, pageId } }) => {
      await bulkValidateUserPermissionsForResources({
        siteId,
        action: "publish",
        userId: ctx.user.id,
      })
      // check if the input.scheduledAt is after the current time
      if (isBefore(scheduledAt, new Date())) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Scheduled time must be in the future",
        })
      }
      const by = await db
        .selectFrom("User")
        .where("id", "=", ctx.user.id)
        .selectAll()
        .executeTakeFirstOrThrow()

      const updatedPage = await db.transaction().execute(async (tx) => {
        // fetch the resource to be scheduled inside the transaction, to guard against concurrent update issues (race conditions)
        const resource = await getPageById(tx, {
          resourceId: pageId,
          siteId,
        })
        if (!resource) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Resource not found",
          })
        }
        if (resource.scheduledAt) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Page is already scheduled to be published at ${format(
              resource.scheduledAt,
              "yyyy-MM-dd HH:mm",
            )}`,
          })
        }
        // update the resource's scheduled field
        const updatedPage = await updatePageById(
          {
            id: pageId,
            siteId,
            scheduledAt,
          },
          tx,
        )
        // verify that the update was successful
        if (!updatedPage) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to schedule page",
          })
        }
        await schedulePublishResource(
          ctx.logger,
          { resourceId: pageId, siteId, userId: ctx.user.id },
          scheduledAt,
        )
        await logResourceEvent(tx, {
          siteId,
          by,
          delta: {
            before: resource,
            after: updatedPage,
          },
          eventType: AuditLogEvent.SchedulePublish,
        })
        return updatedPage
      })
      await sendScheduledPageEmail({
        resource: updatedPage,
        scheduledAt,
        recipientEmail: by.email,
      })
    }),
  cancelSchedulePage: protectedProcedure
    .input(basePageSchema)
    .mutation(async ({ ctx, input: { siteId, pageId } }) => {
      await bulkValidateUserPermissionsForResources({
        siteId,
        action: "publish",
        userId: ctx.user.id,
      })
      const by = await db
        .selectFrom("User")
        .where("id", "=", ctx.user.id)
        .selectAll()
        .executeTakeFirstOrThrow()
      const updatedPage = await db.transaction().execute(async (tx) => {
        const resource = await getPageById(tx, {
          resourceId: pageId,
          siteId,
        })
        if (!resource) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Resource not found",
          })
        }
        if (!resource.scheduledAt) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "Unable to cancel schedule for a page that is not scheduled",
          })
        }
        // update the resource's scheduled field
        const updatedPage = await updatePageById(
          {
            id: pageId,
            siteId,
            scheduledAt: null,
          },
          tx,
        )
        if (!updatedPage) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to cancel page schedule",
          })
        }
        await unschedulePublishResource(
          ctx.logger,
          pageId,
          resource.scheduledAt,
        )
        await logResourceEvent(tx, {
          siteId,
          by,
          delta: {
            before: resource,
            after: updatedPage,
          },
          eventType: AuditLogEvent.CancelSchedulePublish,
        })
        return updatedPage
      })
      await sendCancelSchedulePageEmail({
        resource: updatedPage,
        recipientEmail: by.email,
      })
    }),
  updatePageBlob: validatedPageProcedure
    .input(updatePageBlobSchema)
    .mutation(async ({ input, ctx }) => {
      await bulkValidateUserPermissionsForResources({
        siteId: input.siteId,
        action: "update",
        userId: ctx.user.id,
      })

      const resource = await getPageById(db, {
        resourceId: input.pageId,
        siteId: input.siteId,
      })

      if (!resource) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Resource not found",
        })
      }

      const by = await db
        .selectFrom("User")
        .where("id", "=", ctx.user.id)
        .selectAll()
        .executeTakeFirstOrThrow(
          () =>
            new TRPCError({
              code: "BAD_REQUEST",
              message: "Please ensure that you are authenticated",
            }),
        )

      await db.transaction().execute(async (tx) => {
        const oldBlob = await getBlobOfResource({
          db: tx,
          resourceId: String(input.pageId),
        })
        const updatedBlob = await updateBlobById(tx, input)

        await logResourceEvent(tx, {
          siteId: input.siteId,
          by,
          delta: {
            before: { blob: oldBlob, resource },
            after: { blob: updatedBlob, resource },
          },
          eventType: AuditLogEvent.ResourceUpdate,
        })
        return updatedBlob
      })

      return input
    }),

  createPage: protectedProcedure
    .input(createPageSchema)
    .mutation(
      async ({
        ctx,
        input: { permalink, siteId, folderId, title, layout },
      }) => {
        await bulkValidateUserPermissionsForResources({
          siteId,
          action: "create",
          userId: ctx.user.id,
          resourceIds: [!!folderId ? String(folderId) : null],
        })

        const newPage = createDefaultPage({ layout })

        const by = await db
          .selectFrom("User")
          .where("id", "=", ctx.user.id)
          .selectAll()
          .executeTakeFirstOrThrow(
            () =>
              new TRPCError({
                code: "BAD_REQUEST",
                message: "Please ensure that you are authenticated",
              }),
          )

        // TODO: Validate whether siteId is a valid site
        // TODO: Validate user has write-access to the site
        const resource = await db
          .transaction()
          .execute(async (tx) => {
            // Validate whether folderId is a folder
            if (folderId) {
              const folder = await tx
                .selectFrom("Resource")
                .where("Resource.id", "=", String(folderId))
                .where("Resource.siteId", "=", siteId)
                .where("Resource.type", "=", ResourceType.Folder)
                .select("Resource.id")
                .executeTakeFirst()
              if (!folder) {
                throw new TRPCError({
                  code: "NOT_FOUND",
                  message: "Folder not found or folderId is not a folder",
                })
              }
            }

            const blob = await tx
              .insertInto("Blob")
              .values({
                content: jsonb(newPage),
              })
              .returningAll()
              .executeTakeFirstOrThrow()

            const addedResource = await tx
              .insertInto("Resource")
              .values({
                title,
                permalink,
                siteId,
                parentId: folderId ? String(folderId) : undefined,
                draftBlobId: blob.id,
                type: ResourceType.Page,
              })
              .returningAll()
              .executeTakeFirstOrThrow()
              .catch((err) => {
                if (get(err, "code") === PG_ERROR_CODES.uniqueViolation) {
                  throw new TRPCError({
                    code: "CONFLICT",
                    message:
                      "A resource with the same permalink already exists",
                  })
                }
                throw err
              })

            await logResourceEvent(tx, {
              siteId,
              by,
              delta: { before: null, after: { blob, resource: addedResource } },
              eventType: AuditLogEvent.ResourceCreate,
            })

            return addedResource
          })
          .catch((err) => {
            if (get(err, "code") === PG_ERROR_CODES.uniqueViolation) {
              throw new TRPCError({
                code: "CONFLICT",
                message: "A resource with the same permalink already exists",
              })
            }
            // Foreign key violation error
            if (get(err, "code") === "23503") {
              throw new TRPCError({
                code: "NOT_FOUND",
                message: "Site not found",
              })
            }
            throw err
          })

        return { pageId: resource.id }
      },
    ),

  getRootPage: protectedProcedure
    .input(getRootPageSchema)
    .query(async ({ ctx, input: { siteId } }) => {
      await bulkValidateUserPermissionsForResources({
        siteId,
        action: "read",
        userId: ctx.user.id,
      })

      const rootPage = await db
        .selectFrom("Resource")
        // TODO: Only return sites that the user has access to
        .where("Resource.siteId", "=", siteId)
        .where("Resource.type", "=", ResourceType.RootPage)
        .select(["id", "title", "draftBlobId"])
        .executeTakeFirst()

      if (!rootPage) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Root page not found",
        })
      }
      return rootPage
    }),

  publishPage: protectedProcedure
    .input(publishPageSchema)
    .mutation(async ({ ctx, input: { siteId, pageId } }) => {
      await bulkValidateUserPermissionsForResources({
        siteId,
        action: "publish",
        userId: ctx.user.id,
      })
      const user = await db
        .selectFrom("User")
        .selectAll()
        .where("id", "=", ctx.user.id)
        .executeTakeFirstOrThrow(
          () =>
            new TRPCError({
              code: "PRECONDITION_FAILED",
              message: "Please ensure that you have logged in",
            }),
        )

      const { version } = await publishPageResource({
        logger: ctx.logger,
        siteId,
        resourceId: String(pageId),
        user,
        isScheduled: false,
        addCodebuildJobRow: getIsScheduledPublishingEnabledForSite({
          gb: ctx.gb,
          siteId,
        }),
      })

      // Send publish alert emails to all site admins minus the current user if Singpass has been disabled
      if (!ctx.gb.isOn(IS_SINGPASS_ENABLED_FEATURE_KEY)) {
        await alertPublishWhenSingpassDisabled({
          siteId,
          resourceId: String(pageId),
          publisherId: user.id,
          publisherEmail: user.email,
        })
      }
      return version
    }),

  updateMeta: protectedProcedure
    .input(updatePageMetaSchema)
    .mutation(async ({ ctx, input: { meta, siteId, resourceId } }) => {
      await bulkValidateUserPermissionsForResources({
        siteId,
        action: "update",
        userId: ctx.user.id,
      })

      const by = await db
        .selectFrom("User")
        .where("id", "=", ctx.user.id)
        .selectAll()
        .executeTakeFirstOrThrow(
          () =>
            new TRPCError({
              code: "BAD_REQUEST",
              message: "Please ensure that you are authenticated",
            }),
        )

      return db.transaction().execute(async (tx) => {
        const fullPage = await getFullPageById(tx, {
          resourceId: Number(resourceId),
          siteId,
        })

        if (!fullPage?.content) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message:
              "Unable to load content for the requested page, please contact Isomer Support",
          })
        }

        const resource = await getPageById(tx, {
          siteId,
          resourceId: Number(resourceId),
        })

        if (!resource) {
          //  NOTE: This is technically impossible since
          // we use the same resource as previously fetched
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Unable to find the resource to update",
          })
        }

        const { meta: _oldMeta, ...rest } = fullPage.content
        const pageMetaSchema = getLayoutMetadataSchema(fullPage.content.layout)
        const validateFn = ajv.compile(pageMetaSchema)

        const newMeta = safeJsonParse(meta) as PrismaJson.BlobJsonContent | null

        // NOTE: if `meta` was originally passed, then we need to validate it
        // otherwise, the meta never existed and we don't need to validate anyways
        const isValid = !meta || validateFn(newMeta)

        if (!isValid) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid metadata",
            cause: validateFn.errors,
          })
        }

        const newContent = !newMeta
          ? rest
          : ({ ...rest, meta: newMeta } as PrismaJson.BlobJsonContent)

        const oldBlob = await getBlobOfResource({ db: tx, resourceId })
        const newBlob = await updateBlobById(tx, {
          pageId: Number(resourceId),
          content: newContent,
          siteId,
        })

        await logResourceEvent(tx, {
          siteId,
          by,
          delta: {
            before: { resource, blob: oldBlob },
            after: { resource, blob: newBlob },
          },
          eventType: AuditLogEvent.ResourceUpdate,
        })
      })
    }),

  updateSettings: protectedProcedure
    .input(pageSettingsSchema)
    .mutation(
      async ({ ctx, input: { pageId, siteId, title, ...settings } }) => {
        await bulkValidateUserPermissionsForResources({
          siteId,
          action: "update",
          userId: ctx.user.id,
        })

        const by = await db
          .selectFrom("User")
          .where("id", "=", ctx.user.id)
          .selectAll()
          .executeTakeFirstOrThrow(
            () =>
              new TRPCError({
                code: "BAD_REQUEST",
                message: "Please ensure that you are logged in!",
              }),
          )

        return db.transaction().execute(async (tx) => {
          const fullPage = await getFullPageById(tx, {
            resourceId: pageId,
            siteId,
          })

          if (!fullPage?.content) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message:
                "Unable to load content for the requested page, please contact Isomer Support",
            })
          }

          const resource = await getPageById(tx, { resourceId: pageId, siteId })

          // NOTE: This is technically impossible since
          // we already load the `fullPage` above
          if (!resource) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message:
                "Unable to load content for the requested page, please contact Isomer Support",
            })
          }

          try {
            const updatedResource = await tx
              .updateTable("Resource")
              .where("Resource.id", "=", String(pageId))
              .where("Resource.siteId", "=", siteId)
              .where("Resource.type", "in", [
                ResourceType.Page,
                ResourceType.CollectionPage,
                ResourceType.CollectionLink,
                ResourceType.RootPage,
              ])
              .set({ title, ...settings })
              .returningAll()
              .executeTakeFirstOrThrow()
              .catch((err) => {
                if (get(err, "code") === PG_ERROR_CODES.uniqueViolation) {
                  throw new TRPCError({
                    code: "CONFLICT",
                    message:
                      "A resource with the same permalink already exists",
                  })
                }
                throw err
              })

            await logResourceEvent(tx, {
              siteId,
              by,
              delta: { before: resource, after: updatedResource },
              eventType: AuditLogEvent.ResourceUpdate,
            })

            // We do an implicit publish so that we can make the changes to the
            // page settings immediately visible on the end site
            await publishResource(ctx.user.id, updatedResource, ctx.logger)

            return _.pick(updatedResource, [
              "id",
              "type",
              "title",
              "permalink",
              "draftBlobId",
            ])
          } catch (err) {
            if (err instanceof TRPCError) {
              throw err
            }
            throw new TRPCError({
              code: "BAD_REQUEST",
              message:
                "We're unable to update the settings for this page, please try again later",
              cause: err,
            })
          }
        })
      },
    ),
  getFullPermalink: protectedProcedure
    .input(basePageSchema)
    .query(async ({ ctx, input: { pageId, siteId } }) => {
      await bulkValidateUserPermissionsForResources({
        siteId,
        action: "read",
        userId: ctx.user.id,
      })

      const permalink = await getResourceFullPermalink(siteId, pageId)
      if (!permalink) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No permalink could be found for the given page",
        })
      }

      return permalink
    }),
  getPermalinkTree: protectedProcedure
    .input(basePageSchema)
    .query(async ({ ctx, input: { pageId, siteId } }) => {
      await bulkValidateUserPermissionsForResources({
        siteId,
        action: "read",
        userId: ctx.user.id,
      })

      const permalinkTree = await getResourcePermalinkTree(siteId, pageId)
      if (isEmpty(permalinkTree)) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No permalink tree could be found for the given page",
        })
      }
      return permalinkTree
    }),

  createIndexPage: protectedProcedure
    .input(createIndexPageSchema)
    .mutation(async ({ ctx, input: { siteId, parentId } }) => {
      await bulkValidateUserPermissionsForResources({
        siteId,
        action: "create",
        userId: ctx.user.id,
        resourceIds: [String(parentId)],
      })

      const by = await db
        .selectFrom("User")
        .where("id", "=", ctx.user.id)
        .selectAll()
        .executeTakeFirstOrThrow(
          () =>
            new TRPCError({
              code: "BAD_REQUEST",
              message: "Please ensure that you are logged in",
            }),
        )

      // Validate whether parentId exists and is a Folder or Collection
      const parent = await db
        .selectFrom("Resource")
        .where("Resource.id", "=", parentId)
        .where("Resource.siteId", "=", siteId)
        .where("Resource.type", "in", [
          ResourceType.Folder,
          ResourceType.Collection,
        ])
        .select(["title", "type"])
        .executeTakeFirst()

      if (!parent) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Parent resource not found or is not a folder/collection",
        })
      }

      const blobContent =
        parent.type === ResourceType.Collection
          ? {
              layout: ISOMER_USABLE_PAGE_LAYOUTS.Collection,
              page: {
                title: parent.title,
                subtitle: `Read more on ${parent.title.toLowerCase()} here.`,
                defaultSortBy: COLLECTION_PAGE_DEFAULT_SORT_BY,
                defaultSortDirection: COLLECTION_PAGE_DEFAULT_SORT_DIRECTION,
              } as CollectionPagePageProps,
              content: [],
              version: "0.1.0",
            }
          : createFolderIndexPage(parent.title)

      const page = await db.transaction().execute(async (tx) => {
        const blob = await tx
          .insertInto("Blob")
          .values({ content: jsonb(blobContent) })
          .returning("Blob.id")
          .executeTakeFirstOrThrow()

        const addedResource = await tx
          .insertInto("Resource")
          .values({
            title: parent.title,
            permalink: INDEX_PAGE_PERMALINK,
            siteId,
            parentId,
            draftBlobId: blob.id,
            type: ResourceType.IndexPage,
            state: ResourceState.Draft,
          })
          .returningAll()
          .executeTakeFirstOrThrow()
          .catch((err) => {
            if (get(err, "code") === PG_ERROR_CODES.uniqueViolation) {
              throw new TRPCError({
                code: "CONFLICT",
                message: "A resource with the same permalink already exists",
              })
            }
            throw err
          })

        await logResourceEvent(tx, {
          siteId,
          by,
          delta: { before: null, after: addedResource },
          eventType: AuditLogEvent.ResourceCreate,
        })

        return { pageId: addedResource.id }
      })

      return page
    }),
})
