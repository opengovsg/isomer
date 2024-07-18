import {
  getConfigSchema,
  getNotificationSchema,
  setNotificationSchema,
} from "~/schemas/site"
import { protectedProcedure, router } from "~/server/trpc"
import { getFooter, getNavBar } from "../resource/resource.service"
import {
  getNotification,
  getSiteConfig,
  setSiteNotification,
} from "./site.service"

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
      const { siteId, notification } = input
      await setSiteNotification(siteId, notification)
      return input
    }),
})
