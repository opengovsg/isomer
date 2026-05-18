import type { SiteNotificationConfig } from "~/interfaces/internal/Notification"

export const isSiteNotificationActive = (
  notification: SiteNotificationConfig,
): boolean => {
  // For backward compatibility, where type is not provided,
  if (!notification.type) {
    return !!notification.title
  }

  switch (notification.type) {
    case "custom":
      return !!notification.title
    case "antiscam":
      return true
    default:
      const _exhaustiveCheck: never = notification.type
      return _exhaustiveCheck
  }
}
