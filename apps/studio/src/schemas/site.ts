import type { Static } from "@sinclair/typebox"
import { NotificationSchema } from "@opengovsg/isomer-components"
import { Type } from "@sinclair/typebox"
import { z } from "zod"

import { ajv } from "~/utils/ajv"

export type Notification = Static<typeof NotificationSchema>
const NotificationContentSchema = Type.Pick(
  NotificationSchema,
  Type.Literal("content"),
)
const notificationContentValidator = ajv.compile<Notification["content"]>(
  NotificationContentSchema,
)

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
  title: z
    .string()
    .max(100, { message: "Notification must be 100 characters or less" }),
  enabled: z.boolean().default(false),
  content: z
    .custom<Notification["content"]>((value: unknown) => {
      return notificationContentValidator({ content: value })
    }, "Invalid notification content")
    .optional(),
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
