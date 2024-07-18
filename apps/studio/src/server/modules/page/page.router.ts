import type { ContentPageSchemaType } from "@opengovsg/isomer-components"
import { schema } from "@opengovsg/isomer-components"
import { TRPCError } from "@trpc/server"
import Ajv from "ajv"

import {
  createPageSchema,
  getEditPageSchema,
  reorderBlobSchema,
  updatePageBlobSchema,
  updatePageSchema,
} from "~/schemas/page"
import { protectedProcedure, router } from "~/server/trpc"
import { safeJsonParse } from "~/utils/safeJsonParse"
import {
  getFooter,
  getFullPageById,
  getNavBar,
  updateBlobById,
  updatePageById
} from "../resource/resource.service"
import { getSiteConfig } from "../site/site.service"
import { isEqual } from "lodash"

const ajv = new Ajv({ allErrors: true, strict: false })
const schemaValidator = ajv.compile(schema)

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
  readPageAndBlob: protectedProcedure
    .input(getEditPageSchema)
    .query(async ({ input, ctx }) => {
      const { pageId } = input
      const page = await getFullPageById(pageId)

      const pageName: string = page.name
      const siteMeta = await getSiteConfig(page.siteId)
      const navbar = await getNavBar(page.siteId)
      const footer = await getFooter(page.siteId)

      const { content } = page

      return {
        pageName,
        navbar,
        footer,
        content: content as ContentPageSchemaType,
        ...siteMeta,
      }
    }),

  reorderBlock: protectedProcedure
    .input(reorderBlobSchema).mutation(async ({
      input: {
        pageId,
        from,
        to,
        blocks,
      }, ctx
    }) => {
      // NOTE: we have to check against the page's content that we retrieve from db 
      // we adopt a strict check such that we allow the update iff the checksum is the same 
      const fullPage = await getFullPageById(pageId)

      if (!fullPage.content || !fullPage.blobId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "No content found for the requested page" })
      }

      const actualBlocks = (fullPage.content as { content: unknown[] }).content

      if (!isEqual(blocks, actualBlocks)) {
        throw new TRPCError({ code: "CONFLICT", message: "The content of your page was previously updated, please refresh and try again" })
      }

      if (from >= actualBlocks.length || to >= actualBlocks.length || from < 0 || to < 0) {
        throw new TRPCError({ code: "UNPROCESSABLE_CONTENT", message: "Please ensure that you are dragging blocks to a valid position" });
      }

      const [movedBlock] = actualBlocks.splice(from, 1)
      // Insert at destination index
      actualBlocks.splice(to, 0, movedBlock)

      await updateBlobById({
        id: fullPage.blobId, content: JSON.stringify({ ...fullPage.content, content: actualBlocks })
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
      console.log("schema val passed!")
      await updateBlobById({ ...input, id: input.pageId })

      return input
    }),

  createPage: protectedProcedure
    .input(createPageSchema)
    .mutation(({ input, ctx }) => {
      return { pageId: "" }
    }),
  // TODO: Delete page stuff here
})
