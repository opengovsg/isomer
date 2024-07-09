import { type ContentPageSchemaType } from "@opengovsg/isomer-components"

import {
  createPageSchema,
  getEditPageSchema,
  updatePageBlobSchema,
  updatePageSchema,
} from "~/schemas/page"
import { protectedProcedure, publicProcedure, router } from "~/server/trpc"
import {
  getFooter,
  getFullPageById,
  getNavBar,
  updateBlobById,
  updatePageById,
} from "../resource/resource.service"
import { getSiteConfig } from "../site/site.service"

// TODO: Need to do validation like checking for existence of the page
// and whether the user has write-access to said page
const pageProcedure = protectedProcedure

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

  updatePageBlob: pageProcedure
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
