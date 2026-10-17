import type {
  CentralNotificationBroadcast,
  CentralNotificationEntry,
} from "@opengovsg/isomer-components"
import {
  CentralNotificationBroadcastSchema,
  NotificationCustomSchema,
} from "@opengovsg/isomer-components"
import { z } from "zod"
import { ajv } from "~/utils/ajv"

export type CentralNotification = CentralNotificationEntry["notification"]

// Same schema the site renders against, so a published banner cannot crash
// the client.
export const centralNotificationValidator = ajv.compile<CentralNotification>(
  NotificationCustomSchema,
)

export const centralNotificationBroadcastValidator =
  ajv.compile<CentralNotificationBroadcast>(CentralNotificationBroadcastSchema)

const MAX_TITLE_LENGTH = NotificationCustomSchema.properties.title.maxLength

// Sites render central banners without their site map, so only links that
// need no resolving are allowed.
const ABSOLUTE_LINK_REGEX = /^(https?:\/\/|mailto:)/i

const getLinkHrefs = (node: unknown): string[] => {
  if (typeof node !== "object" || node === null) {
    return []
  }

  const { type, attrs } = node as { type?: unknown; attrs?: { href?: unknown } }
  const ownHref =
    type === "link" && typeof attrs?.href === "string" ? [attrs.href] : []

  return [...ownHref, ...Object.values(node).flatMap(getLinkHrefs)]
}

export const setGlobalNotificationSchema = z.object({
  // null clears the banner
  notification: z
    .custom<CentralNotification>(
      (value) => centralNotificationValidator(value),
      {
        message: `Enter a notification title of up to ${MAX_TITLE_LENGTH} characters`,
      },
    )
    .refine(
      (notification) =>
        getLinkHrefs(notification).every((href) =>
          ABSOLUTE_LINK_REGEX.test(href),
        ),
      {
        message:
          "Links in the central banner must be full web addresses or email addresses",
      },
    )
    .nullable(),
  // ETag of the broadcast the editor loaded; null if none existed yet
  version: z.string().nullable(),
})

export type SetGlobalNotificationInput = z.infer<
  typeof setGlobalNotificationSchema
>
