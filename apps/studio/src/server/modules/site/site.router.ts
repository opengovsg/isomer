import {
  getConfigSchema,
  getNotificationSchema,
  setNotificationSchema,
} from "~/schemas/site"
import { protectedProcedure, router } from "~/server/trpc"
import { db } from "../database"
import { getFooter, getNavBar } from "../resource/resource.service"
import {
  clearSiteNotification,
  getNotification,
  getSiteConfig,
  getSiteTheme,
  setSiteNotification,
} from "./site.service"

export const siteRouter = router({
  list: protectedProcedure.query(() => {
    return (
      db
        .selectFrom("Site")
        // TODO: Only return sites that the user has access to
        .select(["Site.id", "Site.name"])
        .execute()
    )
  }),
  getConfig: protectedProcedure
    .input(getConfigSchema)
    .query(async ({ input }) => {
      const { id } = input
      return getSiteConfig(id)
    }),
  getTheme: protectedProcedure
    .input(getConfigSchema)
    .query(async ({ input }) => {
      const { id } = input
      const theme = await getSiteTheme(id)
      return theme
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
  getNotification: protectedProcedure
    .input(getNotificationSchema)
    .query(async ({ input }) => {
      const { siteId } = input
      const notification = await getNotification(siteId)
      return notification
    }),
  setNotification: protectedProcedure
    .input(setNotificationSchema)
    .mutation(async ({ input, ctx }) => {
      const { siteId, notification, notificationEnabled } = input
      if (notificationEnabled) {
        await setSiteNotification(siteId, notification)
      } else {
        await clearSiteNotification(siteId)
      }
      return input
    }),
})
