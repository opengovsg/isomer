import type { IsomerSiteConfigProps } from "@opengovsg/isomer-components"
import type { Notification } from "~/schemas/site"

type PartialSiteConfig = Partial<IsomerSiteConfigProps>
type SiteNotificationResponse = Notification | Record<string, never>
type SearchSgSiteConfig = PartialSiteConfig & {
  search: { type: "searchSG"; clientId: string }
  url: string
}

export const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export const toSiteConfigOrNull = (
  config: unknown,
): PartialSiteConfig | null => {
  if (!isRecord(config)) return null
  return config as PartialSiteConfig
}

export const getSafeSiteConfig = toSiteConfigOrNull
export const isSiteConfig = (
  config: unknown,
): config is Partial<IsomerSiteConfigProps> => {
  return toSiteConfigOrNull(config) !== null
}

export const isSearchSgSiteConfig = (
  siteConfig: PartialSiteConfig | null,
): siteConfig is SearchSgSiteConfig => {
  return (
    siteConfig?.search?.type === "searchSG" &&
    typeof siteConfig.search.clientId === "string" &&
    typeof siteConfig.url === "string"
  )
}

export const hasSearchSgConfig = isSearchSgSiteConfig

export const getSiteNotification = (
  config: unknown,
): SiteNotificationResponse => {
  const siteConfig = toSiteConfigOrNull(config)
  const notification = siteConfig?.notification

  if (!isRecord(notification)) return {}

  return {
    notification: notification as Notification["notification"],
  }
}

export const getNotificationFromSiteConfig = getSiteNotification
