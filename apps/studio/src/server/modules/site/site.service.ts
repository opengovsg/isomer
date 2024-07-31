import { type IsomerSiteConfigProps } from "@opengovsg/isomer-components"
import { TRPCError } from "@trpc/server"

import { db, sql } from "../database"

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
    .select(["Site.codeBuildId", "Site.name", "Site.shortName"])
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
    .set({ config })
    .where("id", "=", siteId)
    .executeTakeFirstOrThrow()
}
export const getNotification = async (siteId: number) => {
  const result = await db
    .selectFrom("Site")
    .select((eb) =>
      eb.ref("Site.config", "->").key("notification").as("notification"),
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
  return result.notification || ""
}

// TODO: Should trigger immediate re-publish of site
export const setSiteNotification = async (
  siteId: number,
  notification: string,
) => {
  return db
    .updateTable("Site")
    .set({
      config: sql`jsonb_set(config, '{"notification"}', to_jsonb(${notification}::text))`,
    })
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
