import type { IsomerSiteConfigProps } from "@opengovsg/isomer-components"
import type { IsomerSiteThemeProps } from "@opengovsg/isomer-components"
import { expect } from "@playwright/test"
import { normalizeRedirectSource } from "~/schemas/redirect"
import { db } from "~/server/modules/database"

export const expectSiteName = (siteId: number) =>
  expect.poll(async () => {
    const row = await db
      .selectFrom("Site")
      .where("id", "=", siteId)
      .select("name")
      .executeTakeFirst()
    return row?.name ?? null
  })

export const expectSiteThemeBrandColour = (siteId: number) =>
  expect.poll(async () => {
    const row = await db
      .selectFrom("Site")
      .where("id", "=", siteId)
      .select("theme")
      .executeTakeFirst()
    const theme = row?.theme as IsomerSiteThemeProps | null
    return theme?.colors?.brand?.canvas?.inverse ?? null
  })

export const expectSiteGtmId = (siteId: number) =>
  expect.poll(async () => {
    const row = await db
      .selectFrom("Site")
      .where("id", "=", siteId)
      .select("config")
      .executeTakeFirst()
    const config = row?.config as IsomerSiteConfigProps & {
      siteGtmId?: string
    }
    return config?.siteGtmId ?? null
  })

export const expectSiteLogoUrl = (siteId: number) =>
  expect.poll(async () => {
    const row = await db
      .selectFrom("Site")
      .where("id", "=", siteId)
      .select("config")
      .executeTakeFirst()
    const config = row?.config as IsomerSiteConfigProps
    return config?.logoUrl ?? null
  })

export const expectSiteNotificationTitle = (siteId: number) =>
  expect.poll(async () => {
    const row = await db
      .selectFrom("Site")
      .where("id", "=", siteId)
      .select("config")
      .executeTakeFirst()
    const config = row?.config as {
      notification?: { title?: string }
    }
    return config?.notification?.title ?? null
  })

export const expectNavbarContains = (siteId: number, text: string) =>
  expect.poll(async () => {
    const row = await db
      .selectFrom("Navbar")
      .where("siteId", "=", siteId)
      .select("content")
      .executeTakeFirst()
    return JSON.stringify(row?.content ?? {}).includes(text)
  })

export const expectFooterContains = (siteId: number, text: string) =>
  expect.poll(async () => {
    const row = await db
      .selectFrom("Footer")
      .where("siteId", "=", siteId)
      .select("content")
      .executeTakeFirst()
    return JSON.stringify(row?.content ?? {}).includes(text)
  })

export const expectRedirectDestination = (siteId: number, source: string) =>
  expect.poll(async () => {
    const normalized = normalizeRedirectSource(source)
    const row = await db
      .selectFrom("Redirect")
      .where("siteId", "=", siteId)
      .where("source", "=", normalized)
      .where("deletedAt", "is", null)
      .select("destination")
      .executeTakeFirst()
    return row?.destination ?? null
  })

export const expectLiveRedirectCount = (siteId: number) =>
  expect.poll(async () => {
    const row = await db
      .selectFrom("Redirect")
      .where("siteId", "=", siteId)
      .where("deletedAt", "is", null)
      .select((eb) => eb.fn.countAll<number>().as("count"))
      .executeTakeFirst()
    return Number(row?.count ?? 0)
  })

export const expectRedirectDeleted = (siteId: number, source: string) =>
  expect.poll(async () => {
    const normalized = normalizeRedirectSource(source)
    const row = await db
      .selectFrom("Redirect")
      .where("siteId", "=", siteId)
      .where("source", "=", normalized)
      .where("deletedAt", "is", null)
      .select("id")
      .executeTakeFirst()
    return row === undefined
  })
