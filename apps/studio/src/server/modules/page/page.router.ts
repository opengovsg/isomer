import type { ContentPageSchemaType } from "@opengovsg/isomer-components"
import { IsomerPageSchema } from "@opengovsg/isomer-components"
import { TypeCompiler } from "@sinclair/typebox/compiler"
import { TRPCError } from "@trpc/server"

import {
  createPageSchema,
  getEditPageSchema,
  updatePageBlobSchema,
  updatePageSchema,
} from "~/schemas/page"
import { protectedProcedure, publicProcedure, router } from "~/server/trpc"
import { safeJsonParse } from "~/utils/safeJsonParse"
import {
  getFooter,
  getFullPageById,
  getNavBar,
  getPageById,
  updateBlobById,
  updatePageById,
} from "../resource/resource.service"
import { getSiteConfig } from "../site/site.service"

const typeCompiler = TypeCompiler.Compile(IsomerPageSchema)

// TODO: Need to do validation like checking for existence of the page
// and whether the user has write-access to said page
const pageProcedure = protectedProcedure
const validatedPageProcedure = pageProcedure.use(async ({ next, rawInput }) => {
  if (
    typeof rawInput === "object" &&
    rawInput != null &&
    "content" in rawInput
  ) {
    // NOTE: content will be the entire page schema for now...
    if (!typeCompiler.Check(JSON.parse(rawInput.content as string))) {
      throw new TRPCError({
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

  return next()
})

export const pageRouter = router({
  readPageAndBlob: pageProcedure
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

  updatePage: pageProcedure
    .input(updatePageSchema)
    .mutation(async ({ input, ctx }) => {
      await updatePageById({ ...input, id: input.pageId })

      return input
    }),

  updatePageBlob: validatedPageProcedure
    .input(updatePageBlobSchema)
    .mutation(async ({ input, ctx }) => {
      await updateBlobById({ ...input, id: input.pageId })

      return input
    }),

  createPage: pageProcedure.input(createPageSchema).query(({ input, ctx }) => {
    return { pageId: "" }
  }),
  // TODO: Delete page stuff here
})
