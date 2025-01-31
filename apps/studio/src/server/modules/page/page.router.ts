import type { IsomerSchema } from "@opengovsg/isomer-components"
import {
  getLayoutMetadataSchema,
  ISOMER_USABLE_PAGE_LAYOUTS,
  schema,
} from "@opengovsg/isomer-components"
import { TRPCError } from "@trpc/server"
import { ResourceState, ResourceType } from "~prisma/generated/generatedEnums"
import { get, isEmpty, isEqual } from "lodash"
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
import { publishSite } from "../aws/codebuild.service"
import { db, jsonb } from "../database"
import { PG_ERROR_CODES } from "../database/constants"
import { validateUserPermissionsForResource } from "../permissions/permissions.service"
import {
  getFooter,
  getFullPageById,
  getNavBar,
  getPageById,
  getResourceFullPermalink,
  getResourcePermalinkTree,
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

        await updateBlobById(tx, {
          pageId,
          content: { ...fullPage.content, content: actualBlocks },
          siteId,
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
      await db.transaction().execute(async (tx) => {
        return updateBlobById(tx, input)
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
              .returning("Blob.id")
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
              .returning("Resource.id")
              .executeTakeFirstOrThrow()
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
      publishResource(ctx.logger, siteId, String(pageId), ctx.user.id),
    ),

  updateMeta: protectedProcedure
    .input(updatePageMetaSchema)
    .mutation(async ({ ctx, input: { meta, siteId, resourceId } }) => {
      await validateUserPermissionsForResource({
        userId: ctx.user.id,
        siteId,
        action: "update",
      })
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

        await updateBlobById(tx, {
          pageId: Number(resourceId),
          content: newContent,
          siteId,
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
              .returning([
                "Resource.id",
                "Resource.type",
                "Resource.title",
                "Resource.permalink",
                "Resource.draftBlobId",
              ])
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

            // We do an implicit publish so that we can make the changes to the
            // page settings immediately visible on the end site
            await publishSite(ctx.logger, siteId)

            return updatedResource
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

      // Get the full permalink of the parent
      const parentFullPermalink = await getResourceFullPermalink(
        siteId,
        Number(parentId),
      )
      if (!parentFullPermalink) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Could not determine parent's full permalink",
        })
      }

      return db.transaction().execute(async (tx) => {
        const blob = await tx
          .insertInto("Blob")
          .values({
            content: jsonb({
              page: {
                title: parent.title,
                permalink: parentFullPermalink,
                lastModified: new Date().toISOString(),
                contentPageHeader: {
                  // follow the same format as autogenerated index pages
                  summary: `Pages in ${parent.title}`,
                },
              },
              layout:
                parent.type === ResourceType.Collection
                  ? ISOMER_USABLE_PAGE_LAYOUTS.Collection
                  : ISOMER_USABLE_PAGE_LAYOUTS.Index,
              content: [],
              version: "0.1.0",
            }),
          })
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
          .returning("Resource.id")
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

        return { pageId: addedResource.id }
      })
    }),
})
