import type { Static } from "@sinclair/typebox"
import {
  IsomerSiteConfigProps,
  NotificationSettingsSchema,
  SiteConfigSchema,
  SiteThemeSchema,
} from "@opengovsg/isomer-components"
import { z } from "zod"

import { ajv } from "~/utils/ajv"

export type Notification = Static<typeof NotificationSettingsSchema>

export const notificationValidator = ajv.compile<Notification>(
  NotificationSettingsSchema,
)

export type SiteTheme = Static<typeof SiteThemeSchema>
export const siteThemeValidator = ajv.compile<SiteTheme>(SiteThemeSchema)

export const getConfigSchema = z.object({
  id: z.number().min(1),
})

export const getLocalisedSitemapSchema = z.object({
  siteId: z.number().min(1),
  resourceId: z.number().min(1),
})

export const getNotificationSchema = z.object({
  siteId: z.number().min(1),
})

// FIXME: This should all extend from `NotificationSchema`
// with the exception of `siteId` so that we always rely on components
// for our definitions
export const setNotificationSchema = z.object({
  siteId: z.number().min(1),
  notification: z.custom<Notification>((value) => {
    return notificationValidator(value)
  }, "Invalid notification content"),
})

export const getNameSchema = z.object({
  siteId: z.number().min(1),
})

export const setFooterSchema = z.object({
  siteId: z.number().min(1),
  footer: z.string(),
})

export const setNavbarSchema = z.object({
  siteId: z.number().min(1),
  navbar: z.string(),
})

// NOTE: This is a temporary schema for editing the JSON content directly,
// until the proper editing experience is implemented
export const setSiteConfigByAdminSchema = z.object({
  siteId: z.number().min(1),
  config: z.string(),
  theme: z.string(),
  navbar: z.string(),
  footer: z.string(),
})

export const createSiteSchema = z.object({
  siteName: z.string().min(1, { message: "Site name is required" }),
})

export const publishSiteSchema = z.object({
  siteId: z.number().min(1),
})

export const updateSiteConfigSchema = z.object({
  siteId: z.number(),
  siteName: z.string(),
})

const isomerSiteConfigValidator =
  ajv.compile<IsomerSiteConfigProps>(SiteConfigSchema)
export const updateSiteIntegrationsSchema = z.object({
  siteId: z.number().min(1),
  data: z.custom<IsomerSiteConfigProps>((value) => {
    const res = isomerSiteConfigValidator(value)
    return res
  }, "Invalid integration settings"),
})
