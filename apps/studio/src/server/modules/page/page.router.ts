import { getLayoutMetadataSchema } from "@opengovsg/isomer-components"
import { TRPCError } from "@trpc/server"
import { get, isEmpty, isEqual } from "lodash"

import {
  basePageSchema,
  createPageSchema,
  getRootPageSchema,
  pageSettingsSchema,
  publishPageSchema,
  readPageOutputSchema,
  reorderBlobSchema,
  updatePageBlobSchema,
} from "~/schemas/page"
import { protectedProcedure, router } from "~/server/trpc"
import { ajv } from "~/utils/ajv"
import { safeJsonParse } from "~/utils/safeJsonParse"
import { shouldStartNewBuild, startProjectById } from "../aws/codebuild.service"
import { db, jsonb, ResourceType } from "../database"
import {
  getFooter,
  getFullPageById,
  getNavBar,
  getPageById,
  getResourceFullPermalink,
  getResourcePermalinkTree,
  updateBlobById,
} from "../resource/resource.service"
import { getSiteConfig, getSiteNameAndCodeBuildId } from "../site/site.service"
import { incrementVersion } from "../version/version.service"
import { createDefaultPage } from "./page.service"

export const pageRouter = router({
  readPage: protectedProcedure
    .input(basePageSchema)
    .output(readPageOutputSchema)
    .query(async ({ input: { pageId, siteId } }) => {
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
    .query(async ({ input: { pageId, siteId } }) => {
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
          type !== ResourceType.IndexPage
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
    .mutation(async ({ input: { pageId, from, to, blocks, siteId } }) => {
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
  updatePageBlob: protectedProcedure
    .input(updatePageBlobSchema)
    .mutation(async ({ input }) => {
      await db.transaction().execute(async (tx) => {
        return updateBlobById(tx, input)
      })

      return input
    }),

  createPage: protectedProcedure
    .input(createPageSchema)
    .mutation(
      async ({ input: { permalink, siteId, folderId, title, layout } }) => {
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
                .where("Resource.type", "=", "Folder")
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
            // TODO: Extract into reusable util function
            // Unique constraint violation error
            if (get(err, "code") === "23505") {
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
    .query(async ({ input: { siteId } }) => {
      const rootPage = await db
        .selectFrom("Resource")
        // TODO: Only return sites that the user has access to
        .where("Resource.siteId", "=", siteId)
        .where("Resource.type", "=", "RootPage")
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
      // Step 1: Create a new version
      const addedVersionResult = await incrementVersion({
        siteId,
        pageId,
        userId: ctx.user.id,
      })

      // Step 2: Get the CodeBuild ID associated with the site
      const site = await getSiteNameAndCodeBuildId(siteId)
      const { codeBuildId } = site
      if (!codeBuildId) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "No CodeBuild project ID found for site",
        })
      }

      // Step 3: Determine if a new build should be started
      const isNewBuildNeeded = await shouldStartNewBuild(
        ctx.logger,
        codeBuildId,
      )

      if (!isNewBuildNeeded) {
        return addedVersionResult
      }

      // Step 4: Start a new build
      await startProjectById(ctx.logger, codeBuildId)
      return addedVersionResult
    }),

  updateSettings: protectedProcedure
    .input(pageSettingsSchema)
    .mutation(
      async ({ input: { pageId, siteId, title, meta, ...settings } }) => {
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

          const { meta: _oldMeta, ...rest } = fullPage.content
          const pageMetaSchema = getLayoutMetadataSchema(
            fullPage.content.layout,
          )
          const validateFn = ajv.compile(pageMetaSchema)

          const newMeta = safeJsonParse(
            meta,
          ) as PrismaJson.BlobJsonContent | null

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

          try {
            const newContent = !newMeta
              ? rest
              : ({ ...rest, meta: newMeta } as PrismaJson.BlobJsonContent)

            await updateBlobById(tx, {
              pageId,
              content: newContent,
              siteId,
            })

            const updatedResource = await tx
              .updateTable("Resource")
              .where("Resource.id", "=", String(pageId))
              .where("Resource.siteId", "=", siteId)
              .where("Resource.type", "in", [
                "Page",
                "CollectionPage",
                "RootPage",
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
                if (get(err, "code") === "23505") {
                  throw new TRPCError({
                    code: "CONFLICT",
                    message:
                      "A resource with the same permalink already exists",
                  })
                }
                throw err
              })

            return {
              ...updatedResource,
              meta: newMeta,
            }
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
    .query(async ({ input }) => {
      const { pageId, siteId } = input
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
    .query(async ({ input }) => {
      const { pageId, siteId } = input
      const permalinkTree = await getResourcePermalinkTree(siteId, pageId)
      if (isEmpty(permalinkTree)) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No permalink tree could be found for the given page",
        })
      }
      return permalinkTree
    }),
})
