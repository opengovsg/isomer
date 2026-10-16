import { useSessionStorage } from "usehooks-ts"

export const useIsCentralNotificationDismissed = () => {
  return useSessionStorage("central-notification-dismissed", false)
}
