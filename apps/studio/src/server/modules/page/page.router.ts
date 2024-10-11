import type { IsomerSchema } from "@opengovsg/isomer-components"
import { getLayoutMetadataSchema, schema } from "@opengovsg/isomer-components"
import { TRPCError } from "@trpc/server"
import Ajv from "ajv"
import { get, isEmpty, isEqual } from "lodash"
import { z } from "zod"

import {
  basePageSchema,
  createPageSchema,
  getRootPageSchema,
  pageSettingsSchema,
  publishPageSchema,
  reorderBlobSchema,
  updatePageBlobSchema,
  updatePageSchema,
} from "~/schemas/page"
import { protectedProcedure, router } from "~/server/trpc"
import { safeJsonParse } from "~/utils/safeJsonParse"
import { db, ResourceType } from "../database"
import {
  getFooter,
  getFullPageById,
  getNavBar,
  getPageById,
  getResourceFullPermalink,
  getResourcePermalinkTree,
  publishResource,
  updateBlobById,
  updatePageById,
} from "../resource/resource.service"
import { getSiteConfig } from "../site/site.service"
import { createDefaultPage } from "./page.service"

const ajv = new Ajv({ allErrors: true, strict: false, logger: false })
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
    .query(async ({ input: { siteId, resourceId } }) => {
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
    .query(async ({ input: { pageId, siteId } }) =>
      getPageById(db, { resourceId: pageId, siteId }),
    ),

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
          type !== ResourceType.RootPage
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
        if (!fullPage.draftBlobId && !fullPage.mainBlobId) {
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

  updatePage: protectedProcedure
    .input(updatePageSchema)
    .mutation(async ({ input }) => {
      await updatePageById({ ...input, id: input.pageId })

      return input
    }),

  updatePageBlob: validatedPageProcedure
    .input(updatePageBlobSchema)
    .mutation(async ({ input }) => {
      // @ts-expect-error we need this because we sanitise as a string
      // but this accepts a nested JSON object
      await updateBlobById(db, { ...input, pageId: input.pageId })

      return input
    }),

  createPage: protectedProcedure
    .input(createPageSchema)
    .mutation(
      async ({ input: { permalink, siteId, folderId, title, layout } }) => {
        const newPage = createDefaultPage({ layout })

        // TODO: Validate whether folderId actually is a folder instead of a page
        // TODO: Validate whether siteId is a valid site
        // TODO: Validate user has write-access to the site
        const resource = await db
          .transaction()
          .execute(async (tx) => {
            const blob = await tx
              .insertInto("Blob")
              .values({
                content: newPage,
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
            if (get(err, "code") === "23505") {
              throw new TRPCError({
                code: "CONFLICT",
                message: "A resource with the same permalink already exists",
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
      return (
        db
          .selectFrom("Resource")
          // TODO: Only return sites that the user has access to
          .where("Resource.siteId", "=", siteId)
          .where("Resource.type", "=", "RootPage")
          .select(["id", "title", "draftBlobId"])
          .executeTakeFirstOrThrow()
      )
    }),

  publishPage: protectedProcedure
    .input(publishPageSchema)
    .mutation(async ({ ctx, input: { siteId, pageId } }) =>
      publishResource(ctx.logger, siteId, String(pageId), ctx.user.id),
    ),

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

          const newMeta =
            !!meta && (JSON.parse(meta) as PrismaJson.BlobJsonContent["meta"])

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
          message: "No permalink could be found for the given page",
        })
      }

      return permalinkTree
    }),
})
