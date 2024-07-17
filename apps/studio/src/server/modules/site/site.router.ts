import { getConfigSchema, setNotificationSchema } from "~/schemas/site"
import { protectedProcedure, router } from "~/server/trpc"
import { getFooter, getNavBar } from "../resource/resource.service"
import { getSiteConfig, setSiteNotification } from "./site.service"

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
  setNotification: protectedProcedure
    .input(setNotificationSchema)
    .mutation(async ({ input, ctx }) => {
      const { id, notificationStr } = input
      await setSiteNotification(id, notificationStr)
      return input
    }),
})
