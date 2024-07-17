import type { ContentPageSchemaType } from "@opengovsg/isomer-components"
import { schema } from "@opengovsg/isomer-components"
import { TRPCError } from "@trpc/server"
import Ajv from "ajv"

import { BlobToImageDataURL } from "~/features/editing-experience/components/form-builder/renderers/controls/utils"
import {
  createPageSchema,
  getEditPageSchema,
  readImageInPageSchema,
  updatePageBlobSchema,
  updatePageSchema,
  uploadImageGetURLSchema,
} from "~/schemas/page"
import { protectedProcedure, router } from "~/server/trpc"
import { safeJsonParse } from "~/utils/safeJsonParse"
import {
  getFooter,
  getFullPageById,
  getNavBar,
  updateBlobById,
  updatePageById,
} from "../resource/resource.service"
import { getSiteConfig } from "../site/site.service"

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

  readImageInPage: pageProcedure
    .input(readImageInPageSchema)
    .query(async ({ input, ctx }) => {
      // NOTE: If image is not publically accessible, might need to add logic to get it
      const res = await fetch(input.imageUrlInSchema)
      const blob = await res.blob()
      const splitUrl = input.imageUrlInSchema.split(".")
      const extension = splitUrl[splitUrl.length - 1] || ""
      const base64Data = await BlobToImageDataURL(blob, extension)
      return { imageDataURL: base64Data }
    }),
  uploadImageGetURL: pageProcedure
    .input(uploadImageGetURLSchema)
    .mutation(({ input, ctx }) => {
      // TODO: Perform image upload logic here
      return { uploadedImageURL: "https://picsum.photos/200/300.jpg" }
    }),
})
