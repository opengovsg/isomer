import type {
  IsomerSiteConfigProps,
  IsomerSiteThemeProps,
  IsomerSiteWideComponentsProps,
} from "@opengovsg/isomer-components"
import { TRPCError } from "@trpc/server"

import {
  createSiteSchema,
  getConfigSchema,
  getLocalisedSitemapSchema,
  getNameSchema,
  getNotificationSchema,
  setNotificationSchema,
  setSiteConfigByAdminSchema,
} from "~/schemas/site"
import { protectedProcedure, router } from "~/server/trpc"
import { safeJsonParse } from "~/utils/safeJsonParse"
import { logConfigEvent } from "../audit/audit.service"
import { AuditLogEvent, db, jsonb } from "../database"
import {
  getFooter,
  getLocalisedSitemap,
  getNavBar,
  publishSiteConfig,
} from "../resource/resource.service"
import {
  clearSiteNotification,
  createSite,
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

      const site = await db.transaction().execute(async (tx) => {
        if (notificationEnabled) {
          return await setSiteNotification({
            tx,
            siteId,
            userId: ctx.user.id,
            notification,
          })
        } else {
          return await clearSiteNotification({
            tx,
            siteId,
            userId: ctx.user.id,
          })
        }
      })

      await publishSiteConfig(ctx.user.id, { site }, ctx.logger)

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
        const user = await tx
          .selectFrom("User")
          .where("id", "=", ctx.user.id)
          .selectAll()
          .executeTakeFirst()

        if (!user) {
          // NOTE: This shouldn't happen as the user is already logged in
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "The user could not be found.",
          })
        }

        // Update site-level configuration
        const oldSite = await tx
          .selectFrom("Site")
          .where("id", "=", siteId)
          .selectAll()
          .executeTakeFirst()

        if (!oldSite) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "The site could not be found.",
          })
        }

        const newSite = await tx
          .updateTable("Site")
          .set({
            config: jsonb(safeJsonParse(config) as IsomerSiteConfigProps),
            theme: jsonb(safeJsonParse(theme) as IsomerSiteThemeProps),
          })
          .where("id", "=", siteId)
          .returningAll()
          .executeTakeFirst()

        if (!newSite) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to update site configuration.",
          })
        }

        await logConfigEvent(tx, {
          eventType: AuditLogEvent.SiteConfigUpdate,
          delta: {
            before: oldSite,
            after: newSite,
          },
          by: user,
        })

        // Update Navbar contents
        const oldNavbar = await tx
          .selectFrom("Navbar")
          .where("siteId", "=", siteId)
          .selectAll()
          .executeTakeFirst()

        if (!oldNavbar) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "The navbar for the site could not be found.",
          })
        }

        const newNavbar = await tx
          .updateTable("Navbar")
          .set({
            content: jsonb(
              safeJsonParse(
                navbar,
              ) as IsomerSiteWideComponentsProps["navBarItems"],
            ),
          })
          .where("siteId", "=", siteId)
          .returningAll()
          .executeTakeFirst()

        if (!newNavbar) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to update site navbar.",
          })
        }

        await logConfigEvent(tx, {
          eventType: AuditLogEvent.NavbarUpdate,
          delta: {
            before: oldNavbar,
            after: newNavbar,
          },
          by: user,
        })

        // Update Footer contents
        const oldFooter = await tx
          .selectFrom("Footer")
          .where("siteId", "=", siteId)
          .selectAll()
          .executeTakeFirst()

        if (!oldFooter) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "The footer for the site could not be found.",
          })
        }

        const newFooter = await tx
          .updateTable("Footer")
          .set({
            content: jsonb(
              safeJsonParse(
                footer,
              ) as IsomerSiteWideComponentsProps["footerItems"],
            ),
          })
          .where("siteId", "=", siteId)
          .returningAll()
          .executeTakeFirst()

        if (!newFooter) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to update site footer.",
          })
        }

        await logConfigEvent(tx, {
          eventType: AuditLogEvent.FooterUpdate,
          delta: {
            before: oldFooter,
            after: newFooter,
          },
          by: user,
        })

        await publishSiteConfig(
          ctx.user.id,
          { site: newSite, navbar: newNavbar, footer: newFooter },
          ctx.logger,
        )
      })
    }),
  create: protectedProcedure
    .input(createSiteSchema)
    .mutation(async ({ ctx, input: { siteName } }) => {
      // TODO: add validation for isomer admins

      return createSite({ siteName })
    }),
})
