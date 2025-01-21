import {
  getConfigSchema,
  getLocalisedSitemapSchema,
  getNameSchema,
  getNotificationSchema,
  setNotificationSchema,
} from "~/schemas/site"
import { protectedProcedure, router } from "~/server/trpc"
import { publishSite } from "../aws/codebuild.service"
import { db } from "../database"
import {
  getFooter,
  getLocalisedSitemap,
  getNavBar,
} from "../resource/resource.service"
import {
  clearSiteNotification,
  getNotification,
  getSiteConfig,
  getSiteTheme,
  setSiteNotification,
  validateUserPermissionsForSite,
} from "./site.service"

export const siteRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    // NOTE: Any role should be able to read site
    return db
      .selectFrom("Site")
      .innerJoin("ResourcePermission", "Site.id", "ResourcePermission.siteId")
      .where("ResourcePermission.userId", "=", ctx.user.id)
      .select(["Site.id", "Site.config"])
      .groupBy(["Site.id", "Site.config"])
      .execute()
  }),
  getSiteName: protectedProcedure
    .input(getNameSchema)
    .query(async ({ ctx, input: { siteId } }) => {
      await validateUserPermissionsForSite({
        siteId,
        userId: ctx.user.id,
        action: "read",
      })

      const { config } = await db
        .selectFrom("Site")
        .where("Site.id", "=", siteId)
        .select("config")
        .executeTakeFirstOrThrow()

      return { name: config.siteName }
    }),
  getConfig: protectedProcedure
    .input(getConfigSchema)
    .query(async ({ ctx, input }) => {
      const { id } = input
      await validateUserPermissionsForSite({
        siteId: id,
        userId: ctx.user.id,
        action: "read",
      })
      return getSiteConfig(id)
    }),
  getTheme: protectedProcedure
    .input(getConfigSchema)
    .query(async ({ ctx, input }) => {
      const { id } = input
      await validateUserPermissionsForSite({
        siteId: id,
        userId: ctx.user.id,
        action: "read",
      })
      const theme = await getSiteTheme(id)
      return theme
    }),
  getFooter: protectedProcedure
    .input(getConfigSchema)
    .query(async ({ ctx, input }) => {
      const { id } = input
      await validateUserPermissionsForSite({
        siteId: id,
        userId: ctx.user.id,
        action: "read",
      })
      return getFooter(id)
    }),
  getNavbar: protectedProcedure
    .input(getConfigSchema)
    .query(async ({ ctx, input }) => {
      const { id } = input
      await validateUserPermissionsForSite({
        siteId: id,
        userId: ctx.user.id,
        action: "read",
      })
      return getNavBar(id)
    }),
  getLocalisedSitemap: protectedProcedure
    .input(getLocalisedSitemapSchema)
    .query(async ({ ctx, input }) => {
      const { siteId, resourceId } = input
      await validateUserPermissionsForSite({
        siteId,
        userId: ctx.user.id,
        action: "read",
      })
      return getLocalisedSitemap(siteId, resourceId)
    }),
  getNotification: protectedProcedure
    .input(getNotificationSchema)
    .query(async ({ ctx, input }) => {
      const { siteId } = input
      await validateUserPermissionsForSite({
        siteId,
        userId: ctx.user.id,
        action: "read",
      })
      const notification = await getNotification(siteId)
      return notification
    }),
  setNotification: protectedProcedure
    .input(setNotificationSchema)
    .mutation(async ({ ctx, input }) => {
      const { siteId, notification, notificationEnabled } = input
      await validateUserPermissionsForSite({
        siteId,
        userId: ctx.user.id,
        action: "update",
      })
      if (notificationEnabled) {
        await setSiteNotification(siteId, notification)
      } else {
        await clearSiteNotification(siteId)
      }

      await publishSite(ctx.logger, siteId)

      return input
    }),
})
