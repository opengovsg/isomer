import type { CentralNotificationEntry } from "@opengovsg/isomer-components"
import { NotificationCustomSchema } from "@opengovsg/isomer-components"
import { z } from "zod"
import { ajv } from "~/utils/ajv"

export type CentralNotification = CentralNotificationEntry["notification"]

// Same schema the site renders against, so a published banner cannot crash
// the client.
export const centralNotificationValidator = ajv.compile<CentralNotification>(
  NotificationCustomSchema,
)

export const setGlobalNotificationSchema = z.object({
  // null clears the banner
  notification: z
    .custom<CentralNotification>(
      (value) => centralNotificationValidator(value),
      {
        message: "Enter a notification title of up to 150 characters",
      },
    )
    .nullable(),
  // ETag of the broadcast the editor loaded; null if none existed yet
  version: z.string().nullable(),
})

export type SetGlobalNotificationInput = z.infer<
  typeof setGlobalNotificationSchema
>
