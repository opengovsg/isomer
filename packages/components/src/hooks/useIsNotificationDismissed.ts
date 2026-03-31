import { useSessionStorage } from "usehooks-ts"

export const useIsNotificationDismissed = () => {
  return useSessionStorage("notification-dismissed", false)
}
