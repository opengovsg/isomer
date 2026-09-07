/* oxlint-disable typescript/strict-boolean-expressions, typescript/no-confusing-void-expression, anti-slop/no-unknown-parameters, typescript/no-unsafe-type-assertion, typescript/no-unnecessary-type-conversion -- server lint cleanup */
import type { IsomerSchema } from "@opengovsg/isomer-components"
import {
  COLLECTION_VARIANT_OPTIONS,
  getLayoutMetadataSchema,
  ISOMER_USABLE_PAGE_LAYOUTS,
  renderPrefillText,
  schema,
} from "@opengovsg/isomer-components"
import { TRPCError } from "@trpc/server"
import { format, isBefore } from "date-fns"
import { get, isEmpty, isEqual, pick } from "lodash-es"
import {
  INDEX_PAGE_PERMALINK,
  SEARCH_PAGE_PERMALINK,
} from "~/constants/sitemap"
import {
  sendCancelSchedulePageEmail,
  sendScheduledPageEmail,
} from "~/features/mail/service"
import {
  ENABLE_CODEBUILD_JOBS,
  getIsSingpassDisabledInNonPreview,
} from "~/lib/growthbook"
import {
  basePageSchema,
  createIndexPageSchema,
  createPageSchema,
  getPrefillSchema,
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
import { hasNonEmptyString, isDefinedNumber } from "~/utils/truthiness"
import {
  AuditLogEvent,
  ResourceState,
  ResourceType,
} from "~prisma/generated/generatedEnums"

import { logResourceEvent } from "../audit/audit.service"
import { alertPublishWhenSingpassDisabled } from "../auth/email/email.service"
import { PG_ERROR_CODES } from "../database/constants"
import { db } from "../database/database"
import { sql } from "../database/types"
import { jsonb } from "../database/utils"
import { bulkValidateUserPermissionsForResources } from "../permissions/permissions.service"
import { applyPermalinkChangeRedirects } from "../redirect/redirect.service"
import {
  createResourceWithBlob,
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
import { createDefaultPage, createFolderIndexPage } from "./page.service"

const schemaValidator = ajv.compile<IsomerSchema>(schema)

type UnparsedProcedureInput =
  | string
  | number
  | boolean
  | null
  | { content: string }
  | { [key: string]: UnparsedProcedureInput }

const isPageContentInput = (
  input: UnparsedProcedureInput,
): input is { content: string } => {
  if (input === null || typeof input !== "object" || !("content" in input)) {
    return false
  }
  // SAFETY: content field presence is checked above before narrowing to string
  const record = input as { content: UnparsedProcedureInput }
  return Object.prototype.toString.call(record.content) === "[object String]"
}

// Deferred: Need to do validation like checking for existence of the page
// and whether the user has write-access to said page: replace protectorProcedure in this with the new procedure
const validatedPageProcedure = protectedProcedure.use(
  async ({ next, getRawInput }) => {
    const rawInput =
      // SAFETY: tRPC raw input is validated immediately by isPageContentInput below
      (await getRawInput()) as UnparsedProcedureInput

    if (isPageContentInput(rawInput)) {
      // NOTE: content will be the entire page schema for now...
      if (!schemaValidator(safeJsonParse(rawInput.content))) {
        throw new TRPCError({
          cause: schemaValidator.errors,
          code: "BAD_REQUEST",
          message: "Schema validation failed.",
        })
      }
    } else {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Missing request parameters.",
      })
    }

    return await next()
  },
)

export const pageRouter = router({
  cancelSchedulePage: protectedProcedure
    .input(basePageSchema)
    .mutation(async ({ ctx, input: { siteId, pageId } }) => {
      await bulkValidateUserPermissionsForResources({
        action: "publish",
        siteId,
        userId: ctx.user.id,
      })
      const by = await db
        .selectFrom("User")
        .where("id", "=", ctx.user.id)
        .selectAll()
        .executeTakeFirstOrThrow()
      const updatedPage = await db.transaction().execute(async (tx) => {
        const resource = await getPageById(tx, { resourceId: pageId, siteId })
        if (resource === undefined) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Resource not found",
          })
        }
        if (!hasNonEmptyString(resource.scheduledAt)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "Unable to cancel schedule for a page that is not scheduled",
          })
        }

        // update the resource's scheduled field
        const savedPage = await updatePageById(
          { id: pageId, scheduledAt: null, scheduledBy: null, siteId },
          tx,
        )
        if (savedPage === undefined) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to cancel page schedule",
          })
        }
        await logResourceEvent(tx, {
          by,
          delta: { after: savedPage, before: resource },
          eventType: AuditLogEvent.CancelSchedulePublish,
          siteId,
        })
        return savedPage
      })
      await sendCancelSchedulePageEmail({
        recipientEmail: by.email,
        resource: updatedPage,
      })
    }),

  createIndexPage: protectedProcedure
    .input(createIndexPageSchema)
    .mutation(async ({ ctx, input: { siteId, parentId } }) => {
      await bulkValidateUserPermissionsForResources({
        action: "create",
        resourceIds: [String(parentId)],
        siteId,
        userId: ctx.user.id,
      })

      const [by, parent] = await Promise.all([
        db
          .selectFrom("User")
          .where("id", "=", ctx.user.id)
          .selectAll()
          .executeTakeFirstOrThrow(
            () =>
              new TRPCError({
                code: "BAD_REQUEST",
                message: "Please ensure that you are logged in",
              }),
          ),
        db
          .selectFrom("Resource")
          .where("Resource.id", "=", parentId)
          .where("Resource.siteId", "=", siteId)
          .where("Resource.type", "in", [
            ResourceType.Folder,
            ResourceType.Collection,
          ])
          .select(["title", "type"])
          .executeTakeFirst(),
      ])

      if (!hasNonEmptyString(parent)) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Parent resource not found or is not a folder/collection",
        })
      }

      const blobContent =
        parent.type === ResourceType.Collection
          ? {
              content: [],
              layout: ISOMER_USABLE_PAGE_LAYOUTS.Collection,
              page: {
                sortOrder: "date-desc",
                subtitle: `Read more on ${parent.title.toLowerCase()} here.`,
                title: parent.title,
                variant: COLLECTION_VARIANT_OPTIONS.Collection,
              },
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
            draftBlobId: blob.id,
            parentId,
            permalink: INDEX_PAGE_PERMALINK,
            siteId,
            state: ResourceState.Draft,
            title: parent.title,
            type: ResourceType.IndexPage,
          })
          .returningAll()
          .executeTakeFirstOrThrow()
          .catch((error: unknown) => {
            if (get(error, "code") === PG_ERROR_CODES.uniqueViolation) {
              throw new TRPCError({
                code: "CONFLICT",
                message: "A resource with the same permalink already exists",
              })
            }
            throw error
          })

        await logResourceEvent(tx, {
          by,
          delta: { after: addedResource, before: null },
          eventType: AuditLogEvent.ResourceCreate,
          siteId,
        })

        return { pageId: addedResource.id }
      })

      return page
    }),

  createPage: protectedProcedure
    .input(createPageSchema)
    .mutation(
      async ({
        ctx,
        input: { permalink, siteId, folderId, title, layout },
      }) => {
        await bulkValidateUserPermissionsForResources({
          action: "create",
          resourceIds: [isDefinedNumber(folderId) ? String(folderId) : null],
          siteId,
          userId: ctx.user.id,
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

        const resource = await db
          .transaction()
          .execute(async (tx) => {
            const { resource: addedResource, blob } =
              await createResourceWithBlob({
                blobContent: newPage,
                kysely: tx,
                parentId: isDefinedNumber(folderId) ? String(folderId) : null,
                permalink,
                siteId,
                title,
                type: ResourceType.Page,
              })

            await logResourceEvent(tx, {
              by,
              delta: { after: { blob, resource: addedResource }, before: null },
              eventType: AuditLogEvent.ResourceCreate,
              siteId,
            })

            return addedResource
          })
          .catch((error: unknown) => {
            if (get(error, "code") === PG_ERROR_CODES.uniqueViolation) {
              throw new TRPCError({
                code: "CONFLICT",
                message: "A resource with the same permalink already exists",
              })
            }
            // Foreign key violation error
            if (get(error, "code") === "23503") {
              throw new TRPCError({
                code: "NOT_FOUND",
                message: "Site not found",
              })
            }
            throw error
          })

        return { pageId: resource.id }
      },
    ),

  getCategories: protectedProcedure
    .input(basePageSchema)
    .query(async ({ ctx, input: { pageId, siteId } }) => {
      await bulkValidateUserPermissionsForResources({
        action: "read",
        siteId,
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
        .select((eb) =>
          eb.fn
            .coalesce(
              sql<string>`b.content->'page'->>'category'`,
              sql<string>`vb.content->'page'->>'category'`,
            )
            .as("category"),
        )
        .distinct()
        .execute()

      const categories: string[] = []
      for (const blob of blobs) {
        const { category } = blob
        if (category && category.trim()) {
          categories.push(category)
        }
      }

      return { categories }
    }),

  getFullPermalink: protectedProcedure
    .input(basePageSchema)
    .query(async ({ ctx, input: { pageId, siteId } }) => {
      await bulkValidateUserPermissionsForResources({
        action: "read",
        siteId,
        userId: ctx.user.id,
      })

      const permalink = await getResourceFullPermalink(siteId, pageId)
      if (!hasNonEmptyString(permalink)) {
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
        action: "read",
        siteId,
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

  getPrefill: protectedProcedure
    .input(getPrefillSchema)
    .query(async ({ ctx, input: { siteId, resourceId } }) => {
      await bulkValidateUserPermissionsForResources({
        action: "read",
        siteId,
        userId: ctx.user.id,
      })

      const resource = await getFullPageById(db, {
        resourceId: Number(resourceId),
        siteId,
      })

      if (resource === undefined) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Resource not found",
        })
      }

      const { title, content } = resource

      return { title, ...renderPrefillText(content) }
    }),

  getRootPage: protectedProcedure
    .input(getRootPageSchema)
    .query(async ({ ctx, input: { siteId } }) => {
      await bulkValidateUserPermissionsForResources({
        action: "read",
        siteId,
        userId: ctx.user.id,
      })

      const rootPage = await db
        .selectFrom("Resource")
        // Deferred: Only return sites that the user has access to
        .where("Resource.siteId", "=", siteId)
        .where("Resource.type", "=", ResourceType.RootPage)
        .select(["id", "title", "draftBlobId"])
        .executeTakeFirst()

      if (!hasNonEmptyString(rootPage)) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Root page not found",
        })
      }
      return rootPage
    }),

  list: protectedProcedure
    .input(listPagesSchema)
    .query(async ({ ctx, input: { siteId, resourceId } }) => {
      await bulkValidateUserPermissionsForResources({
        action: "read",
        siteId,
        userId: ctx.user.id,
      })

      let query = db
        .selectFrom("Resource")
        .where("Resource.siteId", "=", siteId)

      if (isDefinedNumber(resourceId)) {
        query = query.where("Resource.parentId", "=", String(resourceId))
      }
      return await query
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

  publishPage: protectedProcedure
    .input(publishPageSchema)
    .mutation(
      async ({ ctx: { user, gb, logger }, input: { siteId, pageId } }) => {
        await bulkValidateUserPermissionsForResources({
          action: "publish",
          siteId,
          userId: user.id,
        })
        await publishPageResource({
          logger,
          resourceId: String(pageId),
          siteId,
          sitePublish: {
            enableCodebuildJobs: gb.isOn(ENABLE_CODEBUILD_JOBS),
            isScheduled: false,
          },
          userId: user.id,
        })
        // Send publish alert emails to all site admins minus the current user if Singpass has been disabled
        if (getIsSingpassDisabledInNonPreview({ gb })) {
          await alertPublishWhenSingpassDisabled({
            publisherEmail: user.email,
            publisherId: user.id,
            resourceId: String(pageId),
            siteId,
          })
        }
      },
    ),

  readPage: protectedProcedure
    .input(basePageSchema)
    .output(readPageOutputSchema)
    .query(async ({ ctx, input: { pageId, siteId } }) => {
      await bulkValidateUserPermissionsForResources({
        action: "read",
        siteId,
        userId: ctx.user.id,
      })

      const retrievedPage = await getPageById(db, {
        resourceId: pageId,
        siteId,
      })

      if (!hasNonEmptyString(retrievedPage)) {
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
        action: "read",
        siteId,
        userId: ctx.user.id,
      })

      return await db.transaction().execute(async (tx) => {
        const page = await getFullPageById(tx, { resourceId: pageId, siteId })
        if (page === undefined) {
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

        const [siteMeta, navbar, footer] = await Promise.all([
          getSiteConfig(tx, siteId),
          getNavBar(tx, siteId),
          getFooter(tx, siteId),
        ])

        return {
          content,
          footer,
          navbar,
          permalink,
          title,
          type,
          updatedAt,
          // oxlint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error type instantiation is excessively deep and possibly infinite
          ...siteMeta,
        }
      })
    }),

  reorderBlock: protectedProcedure
    .input(reorderBlobSchema)
    .mutation(async ({ ctx, input: { pageId, from, to, blocks, siteId } }) => {
      await bulkValidateUserPermissionsForResources({
        action: "update",
        siteId,
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
      return await db.transaction().execute(async (tx) => {
        const fullPage = await getFullPageById(tx, {
          resourceId: pageId,
          siteId,
        })
        if (!fullPage?.content) {
          // Deferred: we should probably ping on call
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
        if (!hasNonEmptyString(movedBlock)) {
          return blocks
        }
        if (
          hasNonEmptyString(
            !fullPage.draftBlobId && !fullPage.publishedVersionId,
          )
        ) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Please ensure that you have selected a valid page",
          })
        }

        // Insert at destination index
        actualBlocks.splice(to, 0, movedBlock)

        const [oldBlob, updatedBlob] = await Promise.all([
          getBlobOfResource({
            db: tx,
            resourceId: String(pageId),
          }),
          updateBlobById(tx, {
            content: { ...fullPage.content, content: actualBlocks },
            pageId,
            siteId,
          }),
        ])
        await logResourceEvent(tx, {
          by,
          delta: {
            after: { blob: updatedBlob, resource: fullPage },
            before: { blob: oldBlob, resource: fullPage },
          },
          eventType: AuditLogEvent.ResourceUpdate,
          siteId,
        })

        // NOTE: user given content and db state is the same at this point
        return actualBlocks
      })
    }),

  schedulePage: protectedProcedure
    .input(scheduledPublishServerSchema)
    .mutation(async ({ ctx, input: { scheduledAt, siteId, pageId } }) => {
      await bulkValidateUserPermissionsForResources({
        action: "publish",
        siteId,
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
        const resource = await getPageById(tx, { resourceId: pageId, siteId })
        if (resource === undefined) {
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
        const savedPage = await updatePageById(
          { id: pageId, scheduledAt, scheduledBy: by.id, siteId },
          tx,
        )
        // verify that the update was successful
        if (savedPage === undefined) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to schedule page",
          })
        }
        await logResourceEvent(tx, {
          by,
          delta: { after: savedPage, before: resource },
          eventType: AuditLogEvent.SchedulePublish,
          siteId,
        })
        return savedPage
      })
      await sendScheduledPageEmail({
        recipientEmail: by.email,
        resource: updatedPage,
        scheduledAt,
      })
    }),

  updateMeta: protectedProcedure
    .input(updatePageMetaSchema)
    .mutation(async ({ ctx, input: { meta, siteId, resourceId } }) => {
      await bulkValidateUserPermissionsForResources({
        action: "update",
        siteId,
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

      await db.transaction().execute(async (tx) => {
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
          resourceId: Number(resourceId),
          siteId,
        })

        if (resource === undefined) {
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

        let parsedMeta: PrismaJson.BlobJsonContent | null | undefined
        if (meta) {
          try {
            // SAFETY: validateFn is compiled from the layout-specific metadata schema for this page
            parsedMeta = JSON.parse(meta) as PrismaJson.BlobJsonContent
          } catch {
            parsedMeta = undefined
          }
        } else {
          parsedMeta = undefined
        }

        // NOTE: if `meta` was originally passed, then we need to validate it
        // otherwise, the meta never existed and we don't need to validate anyways
        const isValid = !meta || validateFn(parsedMeta)

        if (!hasNonEmptyString(isValid)) {
          throw new TRPCError({
            cause: validateFn.errors,
            code: "BAD_REQUEST",
            message: "Invalid metadata",
          })
        }

        // SAFETY: parsedMeta passed validateFn for this page's layout metadata schema
        const newContent = parsedMeta
          ? ({
              ...rest,
              meta: parsedMeta,
            } as PrismaJson.BlobJsonContent)
          : rest

        const [oldBlob, newBlob] = await Promise.all([
          getBlobOfResource({ db: tx, resourceId }),
          updateBlobById(tx, {
            content: newContent,
            pageId: Number(resourceId),
            siteId,
          }),
        ])

        await logResourceEvent(tx, {
          by,
          delta: {
            after: { blob: newBlob, resource },
            before: { blob: oldBlob, resource },
          },
          eventType: AuditLogEvent.ResourceUpdate,
          siteId,
        })
      })
    }),

  updatePageBlob: validatedPageProcedure
    .input(updatePageBlobSchema)
    .mutation(async ({ input, ctx }) => {
      await bulkValidateUserPermissionsForResources({
        action: "update",
        siteId: input.siteId,
        userId: ctx.user.id,
      })

      const resource = await getPageById(db, {
        resourceId: input.pageId,
        siteId: input.siteId,
      })

      if (resource === undefined) {
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
        const [oldBlob, updatedBlob] = await Promise.all([
          getBlobOfResource({
            db: tx,
            resourceId: String(input.pageId),
          }),
          updateBlobById(tx, input),
        ])

        await logResourceEvent(tx, {
          by,
          delta: {
            after: { blob: updatedBlob, resource },
            before: { blob: oldBlob, resource },
          },
          eventType: AuditLogEvent.ResourceUpdate,
          siteId: input.siteId,
        })
        return updatedBlob
      })

      return input
    }),

  updateSettings: protectedProcedure
    .input(pageSettingsSchema)
    .mutation(
      async ({
        ctx,
        input: {
          pageId,
          siteId,
          title,
          type,
          shouldCreateRedirect,
          ...settings
        },
      }) => {
        await bulkValidateUserPermissionsForResources({
          action: "update",
          siteId,
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

        return await db.transaction().execute(async (tx) => {
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
          if (resource === undefined) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message:
                "Unable to load content for the requested page, please contact Isomer Support",
            })
          }

          // The search page (permalink /search, no parent) is a default page
          // whose settings cannot be edited.
          if (
            resource.permalink === SEARCH_PAGE_PERMALINK &&
            resource.parentId === null
          ) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "The search page settings cannot be edited",
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
              .catch((error: unknown) => {
                if (get(error, "code") === PG_ERROR_CODES.uniqueViolation) {
                  throw new TRPCError({
                    code: "CONFLICT",
                    message:
                      "A resource with the same permalink already exists",
                  })
                }
                throw error
              })

            await logResourceEvent(tx, {
              by,
              delta: { after: updatedResource, before: resource },
              eventType: AuditLogEvent.ResourceUpdate,
              siteId,
            })

            // Keep redirects consistent when a Page/CollectionPage URL changes
            // (a title-only edit leaves the permalink untouched).
            if (
              (type === ResourceType.Page ||
                type === ResourceType.CollectionPage) &&
              updatedResource.permalink !== resource.permalink
            ) {
              const parentFullPermalink = resource.parentId
                ? await getResourceFullPermalink(
                    siteId,
                    Number(resource.parentId),
                  )
                : null
              const oldFullPermalink = `${parentFullPermalink ?? ""}/${resource.permalink}`
              const newFullPermalink = `${parentFullPermalink ?? ""}/${updatedResource.permalink}`

              await applyPermalinkChangeRedirects(tx, {
                byUserId: ctx.user.id,
                isPublished: updatedResource.publishedVersionId !== null,
                newFullPermalink,
                oldFullPermalink,
                resourceId: String(pageId),
                shouldCreateRedirect,
                siteId,
              })
            }

            // We do an implicit publish so that we can make the changes to the
            // page settings immediately visible on the end site. A page that
            // has never been published has no live presence, so skip the site
            // rebuild and Publish audit entry for it.
            if (updatedResource.publishedVersionId !== null) {
              await publishResource(ctx.user.id, updatedResource, ctx.logger)
            }

            return pick(updatedResource, [
              "id",
              "type",
              "title",
              "permalink",
              "draftBlobId",
            ])
          } catch (error) {
            if (error instanceof TRPCError) {
              throw error
            }
            throw new TRPCError({
              cause: error,
              code: "BAD_REQUEST",
              message:
                "We're unable to update the settings for this page, please try again later",
            })
          }
        })
      },
    ),
})
