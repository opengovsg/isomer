import type { IsomerSchema } from "@opengovsg/isomer-components"
import { schema } from "@opengovsg/isomer-components"
import { TRPCError } from "@trpc/server"
import Ajv from "ajv"
import { isEqual } from "lodash"
import z from "zod"

import {
  createPageSchema,
  getEditPageSchema,
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
  updateBlobById,
  updatePageById,
} from "../resource/resource.service"
import { getSiteConfig } from "../site/site.service"
import { createDefaultPage } from "./page.service"

const ajv = new Ajv({ allErrors: true, strict: false })
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
        query = query.where("Resource.parentId", "=", resourceId)
      }
      return query
        .select([
          "Resource.id",
          "Resource.permalink",
          "Resource.title",
          "Resource.mainBlobId",
          "Resource.draftBlobId",
        ])
        .execute()
    }),
  readPageAndBlob: protectedProcedure
    .input(getEditPageSchema)
    .query(async ({ input: { pageId, siteId } }) => {
      const page = await getFullPageById({ resourceId: pageId, siteId })
      if (!page) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Resource not found",
        })
      }
      const pageName = page.permalink
      const siteMeta = await getSiteConfig(page.siteId)
      const navbar = await getNavBar(page.siteId)
      const footer = await getFooter(page.siteId)

      const { content } = page

      return {
        pageName,
        navbar,
        footer,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore type instantiation is excessively deep and possibly infinite
        content,
        ...siteMeta,
      }
    }),

  reorderBlock: protectedProcedure
    .input(reorderBlobSchema)
    .mutation(async ({ input: { pageId, from, to, blocks, siteId }, ctx }) => {
      // NOTE: we have to check against the page's content that we retrieve from db
      // we adopt a strict check such that we allow the update iff the checksum is the same
      const fullPage = await getFullPageById({ resourceId: pageId, siteId })

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
      if (!fullPage.draftBlobId || !fullPage.mainBlobId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Please ensure that you have selected a valid page" })
      }

      // Insert at destination index
      actualBlocks.splice(to, 0, movedBlock)

      await updateBlobById({
        pageId: fullPage.draftBlobId ?? fullPage.mainBlobId,
        content: { ...fullPage.content, content: actualBlocks },
        siteId,
      })

      // NOTE: user given content and db state is the same at this point
      return actualBlocks
    }),

  updatePage: protectedProcedure
    .input(updatePageSchema)
    .mutation(async ({ input, ctx }) => {
      await updatePageById({ ...input, id: input.pageId })

      return input
    }),

  updatePageBlob: validatedPageProcedure
    .input(updatePageBlobSchema)
    .mutation(async ({ input, ctx }) => {
      // @ts-expect-error we need this because we sanitise as a string 
      // but this accepts a nested JSON object
      await updateBlobById({ ...input, pageId: input.pageId })

      return input
    }),

  createPage: protectedProcedure
    .input(createPageSchema)
    .mutation(
      async ({ input: { permalink, siteId, folderId, title, layout } }) => {
        const newPage = createDefaultPage({ title, layout })

        // TODO: Validate whether folderId actually is a folder instead of a page
        // TODO: Validate whether siteId is a valid site
        // TODO: Validate user has write-access to the site
        const resource = await db.transaction().execute(async (tx) => {
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
              parentId: folderId,
              draftBlobId: blob.id,
              type: ResourceType.Page,
            })
            .returning("Resource.id")
            .executeTakeFirstOrThrow()
          return addedResource
        })
        return { pageId: resource.id }
      },
    ),
})
