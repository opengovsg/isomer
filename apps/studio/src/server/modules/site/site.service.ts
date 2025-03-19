import { TRPCError } from "@trpc/server"

import type { DB, Transaction } from "../database"
import type {
  CrudResourceActions,
  PermissionsProps,
} from "../permissions/permissions.type"
import { logConfigEvent } from "../audit/audit.service"
import { AuditLogEvent, db, jsonb, sql } from "../database"
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

interface SetSiteNotificationParams {
  tx: Transaction<DB>
  siteId: number
  userId: string
  notification: string // TODO: Replace this with Tiptap schema once frontend refactored
}

export const setSiteNotification = async ({
  tx,
  siteId,
  userId,
  notification,
}: SetSiteNotificationParams): Promise<void> => {
  // TODO: Remove tiptap schema coercion when tiptap editor is used on the frontend.
  const notificationSchema = {
    notification: {
      content: [{ type: "text", text: notification }],
    },
  }

  const user = await tx
    .selectFrom("User")
    .where("id", "=", userId)
    .selectAll()
    .executeTakeFirstOrThrow()

  const oldSite = await tx
    .selectFrom("Site")
    .where("id", "=", siteId)
    .selectAll()
    .executeTakeFirstOrThrow()

  const newSite = await tx
    .updateTable("Site")
    .set((eb) => ({
      // @ts-expect-error JSON concat operator replaces the entire notification object if it exists, but Kysely does not have types for this.
      config: eb("Site.config", "||", jsonb(notificationSchema)),
    }))
    .where("id", "=", siteId)
    .returningAll()
    .executeTakeFirstOrThrow()

  await logConfigEvent(tx, {
    eventType: AuditLogEvent.SiteConfigUpdate,
    delta: {
      before: oldSite,
      after: newSite,
    },
    by: user,
  })
}

interface ClearSiteNotificationParams {
  tx: Transaction<DB>
  siteId: number
  userId: string
}

export const clearSiteNotification = async ({
  tx,
  siteId,
  userId,
}: ClearSiteNotificationParams) => {
  const user = await tx
    .selectFrom("User")
    .where("id", "=", userId)
    .selectAll()
    .executeTakeFirstOrThrow()

  const oldSite = await tx
    .selectFrom("Site")
    .where("id", "=", siteId)
    .selectAll()
    .executeTakeFirstOrThrow()

  const newSite = await tx
    .updateTable("Site")
    .set({ config: sql`config - 'notification'` })
    .where("id", "=", siteId)
    .returningAll()
    .executeTakeFirstOrThrow()

  await logConfigEvent(tx, {
    eventType: AuditLogEvent.SiteConfigUpdate,
    delta: {
      before: oldSite,
      after: newSite,
    },
    by: user,
  })
}
