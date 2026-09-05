import type { IsomerSiteConfigProps } from "@opengovsg/isomer-components"
import type { IsomerSiteThemeProps } from "@opengovsg/isomer-components"
import { normalizeRedirectSource } from "~/schemas/redirect/utils"
import { db } from "~/server/modules/database"
import { AuditLogEvent } from "~prisma/generated/generatedEnums"

export const getSiteName = async (siteId: number) => {
  const row = await db
    .selectFrom("Site")
    .where("id", "=", siteId)
    .select("name")
    .executeTakeFirst()
  return row?.name ?? null
}

export const getSiteConfigSiteName = async (siteId: number) => {
  const row = await db
    .selectFrom("Site")
    .where("id", "=", siteId)
    .select("config")
    .executeTakeFirst()
  const config = row?.config as IsomerSiteConfigProps
  return config?.siteName ?? null
}

export const getSiteThemeBrandColour = async (siteId: number) => {
  const row = await db
    .selectFrom("Site")
    .where("id", "=", siteId)
    .select("theme")
    .executeTakeFirst()
  const theme = row?.theme as IsomerSiteThemeProps | null
  return theme?.colors?.brand?.canvas?.inverse ?? null
}

export const getSiteGtmId = async (siteId: number) => {
  const row = await db
    .selectFrom("Site")
    .where("id", "=", siteId)
    .select("config")
    .executeTakeFirst()
  const config = row?.config as IsomerSiteConfigProps & {
    siteGtmId?: string
  }
  return config?.siteGtmId ?? null
}

export const getSiteLogoUrl = async (siteId: number) => {
  const row = await db
    .selectFrom("Site")
    .where("id", "=", siteId)
    .select("config")
    .executeTakeFirst()
  const config = row?.config as IsomerSiteConfigProps
  return config?.logoUrl ?? null
}

export const getSiteAskgovId = async (siteId: number) => {
  const row = await db
    .selectFrom("Site")
    .where("id", "=", siteId)
    .select("config")
    .executeTakeFirst()
  const config = row?.config as IsomerSiteConfigProps & {
    askgov?: { "data-agency"?: string }
  }
  return config?.askgov?.["data-agency"] ?? null
}

export const getSiteVicaId = async (siteId: number) => {
  const row = await db
    .selectFrom("Site")
    .where("id", "=", siteId)
    .select("config")
    .executeTakeFirst()
  const config = row?.config as IsomerSiteConfigProps & {
    vica?: { "app-id"?: string }
  }
  return config?.vica?.["app-id"] ?? null
}

export const getSiteFaviconUrl = async (siteId: number) => {
  const row = await db
    .selectFrom("Site")
    .where("id", "=", siteId)
    .select("config")
    .executeTakeFirst()
  const config = row?.config as IsomerSiteConfigProps & { favicon?: string }
  return config?.favicon ?? null
}

export const getSiteNotificationTitle = async (siteId: number) => {
  const row = await db
    .selectFrom("Site")
    .where("id", "=", siteId)
    .select("config")
    .executeTakeFirst()
  const config = row?.config as {
    notification?: { title?: string }
  }
  return config?.notification?.title ?? null
}

export const getNavbarContentJson = async (siteId: number) => {
  const row = await db
    .selectFrom("Navbar")
    .where("siteId", "=", siteId)
    .select("content")
    .executeTakeFirst()
  return JSON.stringify(row?.content ?? {})
}

export const getFooterContentJson = async (siteId: number) => {
  const row = await db
    .selectFrom("Footer")
    .where("siteId", "=", siteId)
    .select("content")
    .executeTakeFirst()
  return JSON.stringify(row?.content ?? {})
}

export const getRedirectDestination = async (
  siteId: number,
  source: string,
) => {
  const normalized = normalizeRedirectSource(source)
  const row = await db
    .selectFrom("Redirect")
    .where("siteId", "=", siteId)
    .where("source", "=", normalized)
    .where("deletedAt", "is", null)
    .select("destination")
    .executeTakeFirst()
  return row?.destination ?? null
}

export const getLiveRedirectCount = async (siteId: number) => {
  const row = await db
    .selectFrom("Redirect")
    .where("siteId", "=", siteId)
    .where("deletedAt", "is", null)
    .select((eb) => eb.fn.countAll<number>().as("count"))
    .executeTakeFirst()
  return Number(row?.count ?? 0)
}

export const isRedirectLive = async (siteId: number, source: string) => {
  const normalized = normalizeRedirectSource(source)
  const row = await db
    .selectFrom("Redirect")
    .where("siteId", "=", siteId)
    .where("source", "=", normalized)
    .where("deletedAt", "is", null)
    .select("id")
    .executeTakeFirst()
  return row !== undefined
}

export const hasSitePublishAuditLog = async (siteId: number) => {
  const row = await db
    .selectFrom("AuditLog")
    .where("siteId", "=", siteId)
    .where("eventType", "=", AuditLogEvent.Publish)
    .select("id")
    .executeTakeFirst()
  return row !== undefined
}

export const seedRedirect = (opts: {
  siteId: number
  source: string
  destination: string
}) =>
  db
    .insertInto("Redirect")
    .values({
      siteId: opts.siteId,
      source: normalizeRedirectSource(opts.source),
      destination: opts.destination,
    })
    .execute()

export const deleteRedirectBySource = (opts: {
  siteId: number
  source: string
}) =>
  db
    .deleteFrom("Redirect")
    .where("siteId", "=", opts.siteId)
    .where("source", "=", normalizeRedirectSource(opts.source))
    .execute()
