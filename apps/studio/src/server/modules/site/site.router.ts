import type {
  IsomerSiteConfigProps,
  IsomerSiteThemeProps,
  IsomerSiteWideComponentsProps,
} from "@opengovsg/isomer-components"

import {
  getConfigSchema,
  getLocalisedSitemapSchema,
  getNameSchema,
  getNotificationSchema,
  setNotificationSchema,
  setSiteConfigByAdminSchema,
} from "~/schemas/site"
import { protectedProcedure, router } from "~/server/trpc"
import { safeJsonParse } from "~/utils/safeJsonParse"
import { publishSite } from "../aws/codebuild.service"
import { db, jsonb } from "../database"
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
      .where("ResourcePermission.deletedAt", "is", null)
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
  setSiteConfigByAdmin: protectedProcedure
    .input(setSiteConfigByAdminSchema)
    .mutation(async ({ ctx, input }) => {
      const { siteId, config, theme, navbar, footer } = input
      await validateUserPermissionsForSite({
        siteId,
        userId: ctx.user.id,
        action: "update",
      })

      await db.transaction().execute(async (tx) => {
        await tx
          .updateTable("Site")
          .set({
            config: jsonb(safeJsonParse(config) as IsomerSiteConfigProps),
            theme: jsonb(safeJsonParse(theme) as IsomerSiteThemeProps),
          })
          .where("id", "=", siteId)
          .execute()

        await tx
          .updateTable("Navbar")
          .set({
            content: jsonb(
              safeJsonParse(
                navbar,
              ) as IsomerSiteWideComponentsProps["navBarItems"],
            ),
          })
          .where("siteId", "=", siteId)
          .execute()

        await tx
          .updateTable("Footer")
          .set({
            content: jsonb(
              safeJsonParse(
                footer,
              ) as IsomerSiteWideComponentsProps["footerItems"],
            ),
          })
          .where("siteId", "=", siteId)
          .execute()
      })

      await publishSite(ctx.logger, siteId)
    }),
})
