import { protectedProcedure, router } from '~/server/trpc'
import { getConfigSchema } from '~/schemas/site'
import { getSiteConfig } from './site.service'
import { getFooter, getNavBar } from '../resource/resource.service'

export const siteRouter = router({
  getConfig: protectedProcedure
    .input(getConfigSchema)
    .query(async ({ input }) => {
      const { id } = input
      return getSiteConfig(id)
    }),
  getFooter: protectedProcedure
    .input(getConfigSchema)
    .query(async ({ input }) => {
      const { id } = input
      return getFooter(id)
    }),
  getNavbar: protectedProcedure
    .input(getConfigSchema)
    .query(async ({ input }) => {
      const { id } = input
      return getNavBar(id)
    }),
})
