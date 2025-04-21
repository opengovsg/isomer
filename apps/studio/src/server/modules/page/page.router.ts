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
import { ResourceState, ResourceType } from "~prisma/generated/generatedEnums"
import _, { get, isEmpty, isEqual } from "lodash"
import { z } from "zod"

import { INDEX_PAGE_PERMALINK } from "~/constants/sitemap"
import {
  basePageSchema,
  createIndexPageSchema,
  createPageSchema,
  getRootPageSchema,
  pageSettingsSchema,
  publishPageSchema,
  readPageOutputSchema,
  reorderBlobSchema,
  updatePageBlobSchema,
  updatePageMetaSchema,
} from "~/schemas/page"
import { protectedProcedure, router } from "~/server/trpc"
import { ajv } from "~/utils/ajv"
import { safeJsonParse } from "~/utils/safeJsonParse"
import { logResourceEvent } from "../audit/audit.service"
import { db, jsonb, sql } from "../database"
import { PG_ERROR_CODES } from "../database/constants"
import { validateUserPermissionsForResource } from "../permissions/permissions.service"
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
} from "../resource/resource.service"
import { getSiteConfig } from "../site/site.service"
import { createDefaultPage } from "./page.service"

const schemaValidator = ajv.compile<IsomerSchema>(schema)

// TODO: Need to do validation like checking for existence of the page
// and whether the user has write-access to said page: replace protectorProcedure in this with the new procedure
const validatedPageProcedure = protectedProcedure.use(
  async ({ next, rawInput }) => {
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
    .input(
      z.object({
        siteId: z.number(),
        resourceId: z.number().optional(),
      }),
    )
    .query(async ({ ctx, input: { siteId, resourceId } }) => {
      await validateUserPermissionsForResource({
        userId: ctx.user.id,
        siteId,
        action: "read",
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
      await validateUserPermissionsForResource({
        userId: ctx.user.id,
        siteId,
        action: "read",
      })

      const { parentId } = await db
        .selectFrom("Resource")
        .where("id", "=", String(pageId))
        .select("parentId")
        .executeTakeFirstOrThrow()

      const blobs = await db
        .selectFrom("Resource as r")
        .leftJoin("Blob as b", "r.draftBlobId", "b.id")
        .leftJoin("Version as v", "r.publishedVersionId", "v.id")
        .leftJoin("Blob as vb", "v.blobId", "vb.id")
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
      await validateUserPermissionsForResource({
        userId: ctx.user.id,
        siteId,
        action: "read",
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
      await validateUserPermissionsForResource({
        userId: ctx.user.id,
        siteId,
        action: "read",
      })
      // TODO: Return blob last modified so the renderer can show last modified
      return db.transaction().execute(async (tx) => {
        const page = await getFullPageById(tx, { resourceId: pageId, siteId })
        if (!page) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Resource not found",
          })
        }

        const siteMeta = await getSiteConfig(page.siteId)
        const navbar = await getNavBar(page.siteId)
        const footer = await getFooter(page.siteId)

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
      await validateUserPermissionsForResource({
        userId: ctx.user.id,
        siteId,
        action: "update",
      })

      if (!ctx.session?.userId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Please ensure that you are authenticated",
        })
      }

      const by = await db
        .selectFrom("User")
        .where("id", "=", ctx.session.userId)
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
          tx,
          resourceId: String(pageId),
        })
        const updatedBlob = await updateBlobById(tx, {
          pageId,
          content: { ...fullPage.content, content: actualBlocks },
          siteId,
        })
        await logResourceEvent(tx, {
          siteId,
          eventType: "ResourceUpdate",
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

  updatePageBlob: validatedPageProcedure
    .input(updatePageBlobSchema)
    .mutation(async ({ input, ctx }) => {
      await validateUserPermissionsForResource({
        userId: ctx.user.id,
        siteId: input.siteId,
        action: "update",
      })

      if (!ctx.session?.userId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Please ensure that you are authenticated",
        })
      }

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
        .where("id", "=", ctx.session.userId)
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
          tx,
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
          eventType: "ResourceUpdate",
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
        await validateUserPermissionsForResource({
          userId: ctx.user.id,
          siteId,
          action: "create",
          resourceId: !!folderId ? String(folderId) : null,
        })
        const newPage = createDefaultPage({ layout })

        if (!ctx.session?.userId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Please ensure that you are authenticated",
          })
        }

        const by = await db
          .selectFrom("User")
          .where("id", "=", ctx.session.userId)
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

            await logResourceEvent(tx, {
              siteId,
              by,
              delta: { before: null, after: { blob, resource: addedResource } },
              eventType: "ResourceCreate",
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
      await validateUserPermissionsForResource({
        userId: ctx.user.id,
        siteId,
        action: "read",
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
    .mutation(async ({ ctx, input: { siteId, pageId } }) =>
      publishPageResource(ctx.logger, siteId, String(pageId), ctx.user.id),
    ),

  updateMeta: protectedProcedure
    .input(updatePageMetaSchema)
    .mutation(async ({ ctx, input: { meta, siteId, resourceId } }) => {
      await validateUserPermissionsForResource({
        userId: ctx.user.id,
        siteId,
        action: "update",
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

        const oldBlob = await getBlobOfResource({ tx, resourceId })
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
          eventType: "ResourceUpdate",
        })
      })
    }),

  updateSettings: protectedProcedure
    .input(pageSettingsSchema)
    .mutation(
      async ({ ctx, input: { pageId, siteId, title, ...settings } }) => {
        await validateUserPermissionsForResource({
          userId: ctx.user.id,
          siteId,
          action: "update",
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
              eventType: "ResourceUpdate",
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
    .query(async ({ ctx, input }) => {
      const { pageId, siteId } = input
      await validateUserPermissionsForResource({
        userId: ctx.user.id,
        siteId,
        action: "read",
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
    .query(async ({ ctx, input }) => {
      const { pageId, siteId } = input
      await validateUserPermissionsForResource({
        userId: ctx.user.id,
        siteId,
        action: "read",
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
      await validateUserPermissionsForResource({
        userId: ctx.user.id,
        siteId: siteId,
        action: "create",
        resourceId: parentId,
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
        .select(["title", "permalink", "type"])
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
          : {
              layout: ISOMER_USABLE_PAGE_LAYOUTS.Index,
              page: {
                title: parent.title,
                lastModified: new Date().toISOString(),
                contentPageHeader: {
                  // follow the same format as autogenerated index pages
                  summary: `Pages in ${parent.title}`,
                },
              },
              content: [],
              version: "0.1.0",
            }

      return db.transaction().execute(async (tx) => {
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
          eventType: "ResourceCreate",
        })

        return { pageId: addedResource.id }
      })
    }),
})
