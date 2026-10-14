import { useSessionStorage } from "usehooks-ts"

export const useIsUnsupportedBrowserBannerDismissed = () => {
  return useSessionStorage("unsupported-browser-banner-dismissed", false)
}
