import { agnosticProcedure, router } from '~/server/trpc'
import { getEditPageSchema } from "~/schemas/page"

export const pageRouter = router({
  get: agnosticProcedure
    .input(getEditPageSchema)
    // NOTE: Unique constraint on (site_id, page_id)
    // file: B 
    // tree: A -> (B -> D) + C 
    .query(async ({ input, ctx }) => {

      // TODO: Fill these in later
      const fileName: string = ""
      const theme = {}
      const isGovernment = false
      const navbar = {}
      const footer = {}
      const sitemap = {
        parentTitle: "",
        childrenTitles: [""],
        siblingTitles: [""]
      }
      const content = ""

      return {
        // File name
        fileName,
        // NOTE: might shift theme, isGovt, navbar, footer out into separate function?
        // because this is shared across the whole site (site level props)
        theme,
        isGovernment,
        navbar,
        footer,
        // NOTE: This is immediate parent, immediate children and siblings
        sitemap,
        content
      }
    })
})
