import { TRPCError } from "@trpc/server"

import type {
  CrudResourceActions,
  PermissionsProps,
} from "../permissions/permissions.type"
import {
  getConfigSchema,
  getLocalisedSitemapSchema,
  getNotificationSchema,
  setNotificationSchema,
} from "~/schemas/site"
import { protectedProcedure, router } from "~/server/trpc"
import { db } from "../database"
import { definePermissionsForSite } from "../permissions/permissions.service"
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
} from "./site.service"

const validateUserPermissionsForSite = async ({
  siteId,
  userId,
  action,
}: Omit<PermissionsProps, "resourceId"> & { action: CrudResourceActions }) => {
  const perms = await definePermissionsForSite({
    siteId,
    userId,
  })

  // TODO: create should check against the current resource id
  if (perms.cannot(action, "Site")) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have sufficient permissions to perform this action",
    })
  }
}

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
      return input
    }),
})
