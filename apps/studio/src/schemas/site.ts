import { z } from "zod"

export const getConfigSchema = z.object({
  id: z.number().min(1),
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
