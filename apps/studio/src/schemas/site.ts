import type { Static } from "@sinclair/typebox"
import { NotificationSchema } from "@opengovsg/isomer-components"
import { z } from "zod"

import { ajv } from "~/utils/ajv"

type Notification = Static<typeof NotificationSchema>
const notificationValidator = ajv.compile<Notification>(NotificationSchema)

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
  title: z
    .string()
    .max(100, { message: "Notification must be 100 characters or less" }),
  enabled: z.boolean().default(false),
  content: z.custom<Notification>().transform((value, ctx) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    if (notificationValidator(value)) {
      return value
    }
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Invalid notification content",
    })
    return z.NEVER
  }),
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
