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
} from '../resource/resource.service'
import { getSiteMeta } from '../site/site.service'

export const pageRouter = router({
  readPageAndBlob: protectedProcedure
    .input(getEditPageSchema)
    .query(async ({ input, ctx }) => {
      const { pageId, siteId } = input
      const page = await getFullPageById(pageId)
      // TODO: Fill these in later
      const pageName: string = page.name
      const siteMeta = getSiteMeta(siteId)
      const navbar = getNavBar(siteId)
      const footer = getFooter(siteId)
      const { content } = page

      return {
        pageName,
        // NOTE: might shift theme, isGovt, navbar, footer out into separate function?
        // because this is shared across the whole site (site level props)
        ...siteMeta,
        navbar,
        footer,
        // NOTE: This is immediate parent, immediate children and siblings
        content,
      }
    }),

  updatePage: protectedProcedure
    .input(updatePageSchema)
    .query(async ({ input, ctx }) => {
      const parentId = ''
      const pageName = ''

      return {
        // NOTE: This should adhere to our db schema
        parentId,
        pageName,
        // NOTE: Don't need `variant` here
        // because the router itself discriminates for us
      }
    }),
  updatePageBlob: protectedProcedure
    .input(updatePageBlobSchema)
    .query(async ({ input, ctx }) => {
      // NOTE: Not returning the `content` first because
      // 1. it might potentially be huge
      // 2. frontend already knows
      // ahead of time what is the content (it sent the content over)
      return {}
    }),
  createPage: protectedProcedure
    .input(createPageSchema)
    .query(async ({ input, ctx }) => {
      return { pageId: '' }
    }),
  // TODO: Delete page stuff here
})
