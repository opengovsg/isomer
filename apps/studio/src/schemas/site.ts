import type { IsomerSiteConfigProps } from "@opengovsg/isomer-components"
import type { Static } from "@sinclair/typebox"
import {
  LogoSettingsSchema,
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

export type LogoSettings = Static<typeof LogoSettingsSchema>
export const logoSettingsValidator =
  ajv.compile<LogoSettings>(LogoSettingsSchema)

export const getConfigSchema = z.object({
  id: z.number().min(1),
})

export const getLocalisedSitemapSchema = z.object({
  resourceId: z.number().min(1),
  siteId: z.number().min(1),
})

export const getNotificationSchema = z.object({
  siteId: z.number().min(1),
})

// Deferred: This should all extend from `NotificationSchema`
// with the exception of `siteId` so that we always rely on components
// for our definitions
export const setNotificationSchema = z.object({
  notification: z.custom<Notification>(
    (value) => notificationValidator(value),
    "Invalid notification content",
  ),
  siteId: z.number().min(1),
})

export const getNameSchema = z.object({
  siteId: z.number().min(1),
})

export const setFooterSchema = z.object({
  footer: z.string(),
  siteId: z.number().min(1),
})

export const setNavbarSchema = z.object({
  navbar: z.string(),
  siteId: z.number().min(1),
})

// NOTE: This is a temporary schema for editing the JSON content directly,
// until the proper editing experience is implemented
export const setSiteConfigByAdminSchema = z.object({
  config: z.string(),
  footer: z.string(),
  navbar: z.string(),
  siteId: z.number().min(1),
  theme: z.string(),
})

export const createSiteSchema = z.object({
  siteName: z.string().trim().min(1, { message: "Site name is required" }),
})

export const publishSiteSchema = z.object({
  siteId: z.number().min(1),
})

const isomerSiteConfigValidator =
  ajv.compile<IsomerSiteConfigProps>(SiteConfigSchema)

export const updateSiteConfigSchema = z
  .custom<IsomerSiteConfigProps>(isomerSiteConfigValidator)
  .and(
    z.object({
      siteId: z.number(),
      siteName: z.string().trim().min(1, { message: "Site name is required" }),
    }),
  )

export const updateSiteIntegrationsSchema = z.object({
  data: z.custom<IsomerSiteConfigProps>((value) => {
    const res = isomerSiteConfigValidator(value)
    return res
  }, "Invalid integration settings"),
  siteId: z.number().min(1),
})

export const setThemeSchema = z
  .object({
    siteId: z.number().min(1),
  })
  .extend({
    theme: z.custom<SiteTheme>((value) => {
      const res = siteThemeValidator(value)
      return res
    }, "Invalid theme"),
  })
