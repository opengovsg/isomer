import { TRPCError } from "@trpc/server"
import { ISOMER_ADMINS, ISOMER_MIGRATORS } from "~prisma/constants"
import { addUsersToSite } from "~prisma/scripts/addUsersToSite"

import type { DB, Resource, Transaction, Version } from "../database"
import type {
  CrudResourceActions,
  PermissionsProps,
} from "../permissions/permissions.type"
import {
  ResourceState,
  ResourceType,
  RoleType,
} from "~/server/modules/database"
import { logConfigEvent } from "../audit/audit.service"
import { AuditLogEvent, db, jsonb, sql } from "../database"
import { definePermissionsForSite } from "../permissions/permissions.service"
import {
  FOOTER,
  NAVBAR_CONTENT,
  PAGE_BLOB,
  SEARCH_PAGE_BLOB,
} from "./constants"

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
}: SetSiteNotificationParams) => {
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
    .executeTakeFirst()

  if (!user) {
    // NOTE: This shouldn't happen as the user is already logged in
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "The user could not be found",
    })
  }

  const oldSite = await tx
    .selectFrom("Site")
    .where("id", "=", siteId)
    .selectAll()
    .executeTakeFirst()

  if (!oldSite) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "The site could not be found",
    })
  }

  const newSite = await tx
    .updateTable("Site")
    .set((eb) => ({
      // @ts-expect-error JSON concat operator replaces the entire notification object if it exists, but Kysely does not have types for this.
      config: eb("Site.config", "||", jsonb(notificationSchema)),
    }))
    .where("id", "=", siteId)
    .returningAll()
    .executeTakeFirst()

  if (!newSite) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to update site configuration",
    })
  }

  await logConfigEvent(tx, {
    siteId,
    eventType: AuditLogEvent.SiteConfigUpdate,
    delta: {
      before: oldSite,
      after: newSite,
    },
    by: user,
  })

  return newSite
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
    .executeTakeFirst()

  if (!user) {
    // NOTE: This shouldn't happen as the user is already logged in
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "The user could not be found",
    })
  }

  const oldSite = await tx
    .selectFrom("Site")
    .where("id", "=", siteId)
    .selectAll()
    .executeTakeFirst()

  if (!oldSite) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "The site could not be found",
    })
  }

  const newSite = await tx
    .updateTable("Site")
    .set({ config: sql`config - 'notification'` })
    .where("id", "=", siteId)
    .returningAll()
    .executeTakeFirst()

  if (!newSite) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to update site configuration",
    })
  }

  await logConfigEvent(tx, {
    siteId,
    eventType: AuditLogEvent.SiteConfigUpdate,
    delta: {
      before: oldSite,
      after: newSite,
    },
    by: user,
  })

  return newSite
}

interface CreateSiteProps {
  siteName: string
  userId: Version["publishedBy"]
}
interface CreateResourceProps {
  tx: Transaction<DB>
  siteId: Resource["siteId"]
  userId: Version["publishedBy"]
}

export const createSite = async ({ siteName, userId }: CreateSiteProps) => {
  const createSiteRecord = async (tx: Transaction<DB>): Promise<number> => {
    const { id: siteId } = await tx
      .insertInto("Site")
      .values({
        name: siteName,
        theme: jsonb({
          colors: {
            brand: {
              canvas: {
                alt: "#bfcfd7",
                default: "#e6ecef",
                inverse: "#00405f",
                backdrop: "#80a0af",
              },
              interaction: {
                hover: "#002e44",
                default: "#00405f",
                pressed: "#00283b",
              },
            },
          },
        }),
        config: jsonb({
          theme: "isomer-next",
          siteName,
          logoUrl: "https://www.isomer.gov.sg/images/isomer-logo.svg",
          search: undefined,
          isGovernment: true,
        }),
      })
      .onConflict((oc) =>
        oc
          .column("name")
          .doUpdateSet((eb) => ({ name: eb.ref("excluded.name") })),
      )
      .returning("id")
      .executeTakeFirstOrThrow()

    return siteId
  }

  const createFooter = async (tx: Transaction<DB>, siteId: number) => {
    await tx
      .insertInto("Footer")
      .values({
        siteId,
        content: jsonb(FOOTER),
      })
      .onConflict((oc) =>
        oc
          .column("siteId")
          .doUpdateSet((eb) => ({ siteId: eb.ref("excluded.siteId") })),
      )
      .execute()
  }

  const createNavbar = async (tx: Transaction<DB>, siteId: number) => {
    await tx
      .insertInto("Navbar")
      .values({
        siteId,
        content: jsonb(NAVBAR_CONTENT),
      })
      .onConflict((oc) =>
        oc
          .column("siteId")
          .doUpdateSet((eb) => ({ siteId: eb.ref("excluded.siteId") })),
      )
      .execute()
  }

  const createRootPage = async ({
    tx,
    siteId,
    userId,
  }: CreateResourceProps) => {
    const { id: blobId } = await tx
      .insertInto("Blob")
      .values({ content: jsonb(PAGE_BLOB) })
      .returning("id")
      .executeTakeFirstOrThrow()

    const { id: resourceId } = await tx
      .insertInto("Resource")
      .values({
        permalink: "",
        siteId,
        type: ResourceType.RootPage,
        state: ResourceState.Published,
        title: "Home",
      })
      .onConflict((oc) =>
        oc.column("draftBlobId").doUpdateSet((eb) => ({
          draftBlobId: eb.ref("excluded.draftBlobId"),
        })),
      )
      .returning("id")
      .executeTakeFirstOrThrow()

    const { id: versionId } = await tx
      .insertInto("Version")
      .values({
        resourceId,
        blobId,
        publishedBy: userId,
        versionNum: 1,
      })
      .returning("id")
      .executeTakeFirstOrThrow()

    await tx
      .updateTable("Resource")
      .set({
        draftBlobId: null,
        publishedVersionId: versionId,
        state: ResourceState.Published,
      })
      .where("id", "=", resourceId)
      .executeTakeFirstOrThrow()
  }

  const createSearchPage = async ({
    tx,
    siteId,
    userId,
  }: CreateResourceProps) => {
    const { id: blobId } = await tx
      .insertInto("Blob")
      .values({ content: jsonb(SEARCH_PAGE_BLOB) })
      .returning("id")
      .executeTakeFirstOrThrow()

    const { id: resourceId } = await tx
      .insertInto("Resource")
      .values({
        draftBlobId: String(blobId),
        permalink: "search",
        siteId,
        type: ResourceType.Page,
        title: "Search",
      })
      .onConflict((oc) =>
        oc.column("draftBlobId").doUpdateSet((eb) => ({
          draftBlobId: eb.ref("excluded.draftBlobId"),
        })),
      )
      .returning("id")
      .executeTakeFirstOrThrow()

    const { id: versionId } = await tx
      .insertInto("Version")
      .values({
        resourceId,
        blobId,
        publishedBy: userId,
        versionNum: 1,
      })
      .returning("id")
      .executeTakeFirstOrThrow()

    await tx
      .updateTable("Resource")
      .set({
        draftBlobId: null,
        publishedVersionId: versionId,
        state: ResourceState.Published,
      })
      .where("id", "=", resourceId)
      .executeTakeFirstOrThrow()
  }

  const siteId = await db.transaction().execute(async (tx) => {
    const siteId = await createSiteRecord(tx)
    await createFooter(tx, siteId)
    await createNavbar(tx, siteId)
    await createRootPage({ tx, siteId, userId })
    await createSearchPage({ tx, siteId, userId })
    return siteId
  })

  await addUsersToSite({
    siteId,
    users: [...ISOMER_ADMINS, ...ISOMER_MIGRATORS].map((email) => ({
      email: `${email}@open.gov.sg`,
      role: RoleType.Admin,
    })),
  })

  return { siteId, siteName }
}
