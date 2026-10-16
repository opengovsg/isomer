import { useSessionStorage } from "usehooks-ts"

// Holds the dismissed banner's content, so a newly published banner shows
// again in the same session.
export const useDismissedCentralNotification = () => {
  return useSessionStorage<string | null>(
    "central-notification-dismissed",
    null,
  )
}
