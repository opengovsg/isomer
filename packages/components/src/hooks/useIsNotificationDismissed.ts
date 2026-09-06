import { useSessionStorage } from "usehooks-ts"

export const useIsNotificationDismissed = () => 
  useSessionStorage("notification-dismissed", false)

