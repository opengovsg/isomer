import { protectedProcedure, router } from '~/server/trpc'
import {
  createPageSchema,
  getEditPageSchema,
  updatePageBlobSchema,
  updatePageSchema,
} from '~/schemas/page'
import {
  getFooter,
  getFullPageById,
  getNavBar,
  updateBlobById,
  updatePageById,
} from '../resource/resource.service'
import { getSiteConfig } from '../site/site.service'

// TODO: Need to do validation like checking for existence of the page
// and whether the user has write-access to said page
const pageProcedure = protectedProcedure

export const pageRouter = router({
  readPageAndBlob: pageProcedure
    .input(getEditPageSchema)
    .query(async ({ input, ctx }) => {
      const { pageId, siteId } = input
      const page = await getFullPageById(pageId)
      const pageName: string = page.name
      // NOTE: Sitemap in siteMeta is immediate parent, immediate children and siblings
      const siteMeta = getSiteConfig(siteId)
      const navbar = getNavBar(siteId)
      const footer = getFooter(siteId)
      const { content } = page

      return {
        pageName,
        navbar,
        footer,
        content,
        ...siteMeta,
      }
    }),

  updatePage: pageProcedure
    .input(updatePageSchema)
    .query(async ({ input, ctx }) => {
      await updatePageById({ ...input, id: input.pageId })

      return input
    }),

  updatePageBlob: pageProcedure
    .input(updatePageBlobSchema)
    .query(async ({ input, ctx }) => {
      await updateBlobById({ ...input, id: input.pageId })

      return input
    }),

  createPage: pageProcedure
    .input(createPageSchema)
    .query(async ({ input, ctx }) => {
      return { pageId: '' }
    }),
  // TODO: Delete page stuff here
})
