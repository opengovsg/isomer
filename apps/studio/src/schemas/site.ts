import { z } from "zod"

export const getConfigSchema = z.object({
  id: z.number().min(1),
})

export const setNotificationSchema = z.object({
  id: z.number().min(1),
  notificationStr: z.string(),
})
