import { z } from "zod"

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

export const setNotificationSchema = z.object({
  siteId: z.number().min(1),
  notification: z
    .string()
    .max(100, { message: "Notification must be 100 characters or less" }),
  notificationEnabled: z.boolean(),
})

export const getNameSchema = z.object({
  siteId: z.number().min(1),
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
