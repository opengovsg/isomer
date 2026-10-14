import type { Notification } from "~/schemas/site"
import {
  isSiteNotificationActive,
  NotificationSchema,
} from "@opengovsg/isomer-components"
import { ajv } from "~/utils/ajv"

export type SiteNotification = NonNullable<Notification["notification"]>

export const siteNotificationBodyValidator =
  ajv.compile<SiteNotification>(NotificationSchema)

export const normalizeSiteNotification = (
  notification: SiteNotification,
): SiteNotification => {
  if (notification.type === "antiscam") {
    return { type: "antiscam" }
  }

  return notification
}

export const canPublishNotificationSettings = (
  isDirty: boolean,
  notification: Notification["notification"],
): boolean => {
  if (!isDirty) {
    return false
  }

  if (notification === undefined) {
    return true
  }

  return isSiteNotificationActive(notification)
}
