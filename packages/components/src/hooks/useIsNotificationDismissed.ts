import { useSessionStorage } from "usehooks-ts"

export const useIsNotificationDismissed = () => {
  // Read after mount, so the first client render matches the server HTML (hydration).
  return useSessionStorage("notification-dismissed", false, {
    initializeWithValue: false,
  })
}
