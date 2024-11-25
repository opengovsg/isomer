import { type IsomerSiteConfigProps } from "@opengovsg/isomer-components"
import { TRPCError } from "@trpc/server"

import type {
  CrudResourceActions,
  PermissionsProps,
} from "../permissions/permissions.type"
import { db, jsonb, sql } from "../database"
import { definePermissionsForSite } from "../permissions/permissions.service"

export const validateUserPermissionsForSite = async ({
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

export const getSiteConfig = async (siteId: number) => {
  const { config } = await db
    .selectFrom("Site")
    .where("id", "=", siteId)
    .select("Site.config")
    .executeTakeFirstOrThrow()

  return config
}

export const getSiteTheme = async (siteId: number) => {
  const { theme } = await db
    .selectFrom("Site")
    .where("id", "=", siteId)
    .select("Site.theme")
    .executeTakeFirstOrThrow()

  return theme
}
export const getSiteNameAndCodeBuildId = async (siteId: number) => {
  return await db
    .selectFrom("Site")
    .where("id", "=", siteId)
    .select(["Site.codeBuildId", "Site.name"])
    .executeTakeFirstOrThrow()
}

// Note: This overwrites the full site config
// TODO: Should trigger immediate re-publish of site
export const setSiteConfig = async (
  siteId: number,
  config: IsomerSiteConfigProps,
) => {
  return db
    .updateTable("Site")
    .set({ config: jsonb(config) })
    .where("id", "=", siteId)
    .executeTakeFirstOrThrow()
}
export const getNotification = async (siteId: number) => {
  const result = await db
    .selectFrom("Site")
    .select(({ ref }) =>
      // TODO: Return whole notification once frontend refactored to accept Tiptap editor
      ref("Site.config", "->").key("notification").key("content").as("content"),
    )
    .where("id", "=", siteId)
    .executeTakeFirst()
  if (!result) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Site not found",
    })
  }
  // NOTE: Empty string denotes absence of notification on site.
  return result.content?.[0]?.text ?? ""
}

// TODO: Should trigger immediate re-publish of site
export const setSiteNotification = async (
  siteId: number,
  notification: string,
) => {
  // TODO: Remove tiptap schema coercion when tiptap editor is used on the frontend.
  const notificationSchema = {
    notification: {
      content: [{ type: "text", text: notification }],
    },
  }

  return db
    .updateTable("Site")
    .set((eb) => ({
      // @ts-expect-error JSON concat operator replaces the entire notification object if it exists, but Kysely does not have types for this.
      config: eb("Site.config", "||", jsonb(notificationSchema)),
    }))
    .where("id", "=", siteId)
    .executeTakeFirstOrThrow()
}

// TODO: Should trigger immediate re-publish of site
export const clearSiteNotification = async (siteId: number) => {
  return db
    .updateTable("Site")
    .set({ config: sql`config - 'notification'` })
    .where("id", "=", siteId)
    .executeTakeFirstOrThrow()
}
