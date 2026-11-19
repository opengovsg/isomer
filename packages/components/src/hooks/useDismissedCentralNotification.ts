import { useSessionStorage } from "usehooks-ts"

// Holds the dismissed banner's content, so a newly published banner shows
// again in the same session.
export const useDismissedCentralNotification = () => {
  // Read after mount, so the first client render matches the server HTML (hydration).
  return useSessionStorage<string | false>(
    "central-notification-dismissed",
    false,
    { initializeWithValue: false },
  )
}
