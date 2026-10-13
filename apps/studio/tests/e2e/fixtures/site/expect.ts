import { expect } from "@playwright/test"

import {
  getFooterContentJson,
  getLiveRedirectCount,
  getNavbarContentJson,
  getRedirectDestination,
  getSiteAskgovId,
  getSiteConfigSiteName,
  getSiteFaviconUrl,
  getSiteGtmId,
  getSiteLogoUrl,
  getSiteName,
  getSiteNotificationTitle,
  getSiteThemeBrandColour,
  getSiteVicaId,
  hasSitePublishAuditLog,
  isRedirectLive,
} from "./db"

export const expectSiteName = (siteId: number) =>
  expect.poll(() => getSiteName(siteId))

export const expectSiteConfigSiteName = (siteId: number) =>
  expect.poll(() => getSiteConfigSiteName(siteId))

export const expectSiteThemeBrandColour = (siteId: number) =>
  expect.poll(() => getSiteThemeBrandColour(siteId))

export const expectSiteGtmId = (siteId: number) =>
  expect.poll(() => getSiteGtmId(siteId))

export const expectSiteLogoUrl = (siteId: number) =>
  expect.poll(() => getSiteLogoUrl(siteId))

export const expectSiteAskgovId = (siteId: number) =>
  expect.poll(() => getSiteAskgovId(siteId))

export const expectSiteVicaId = (siteId: number) =>
  expect.poll(() => getSiteVicaId(siteId))

export const expectSiteFaviconUrl = (siteId: number) =>
  expect.poll(() => getSiteFaviconUrl(siteId))

export const expectSiteNotificationTitle = (siteId: number) =>
  expect.poll(() => getSiteNotificationTitle(siteId))

export const expectNavbarContains = (siteId: number, text: string) =>
  expect.poll(async () => (await getNavbarContentJson(siteId)).includes(text))

export const expectFooterContains = (siteId: number, text: string) =>
  expect.poll(async () => (await getFooterContentJson(siteId)).includes(text))

export const expectRedirectDestination = (siteId: number, source: string) =>
  expect.poll(() => getRedirectDestination(siteId, source))

export const expectLiveRedirectCount = (siteId: number) =>
  expect.poll(() => getLiveRedirectCount(siteId))

export const expectRedirectDeleted = (siteId: number, source: string) =>
  expect.poll(async () => !(await isRedirectLive(siteId, source)))

export const expectSitePublishAuditLog = (siteId: number) =>
  expect.poll(() => hasSitePublishAuditLog(siteId))
