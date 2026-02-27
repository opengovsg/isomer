import { z } from "zod"

const centralNotificationEntrySchema = z.object({
  notification: z.object({
    title: z.string().min(1).max(150),
    content: z.unknown().optional(),
  }),
  targetSites: z.array(z.string().url()),
})

export const setGlobalNotificationSchema = z.object({
  entries: z.array(centralNotificationEntrySchema),
})

export type SetGlobalNotificationInput = z.infer<
  typeof setGlobalNotificationSchema
>
