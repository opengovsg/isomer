import supportedBrowsers from "./supportedBrowsers"

export interface SupportedBrowserBannerProps {
  userAgent?: string | undefined | null
}

const getUserAgent = (): string | undefined => {
  return typeof window !== "undefined" ? window.navigator.userAgent : undefined
}

export const isSupportedBrowser = ({
  userAgent,
}: SupportedBrowserBannerProps): boolean => {
  if (userAgent === undefined) return true
  if (userAgent === null) return true
  if (userAgent === "") return true
  return supportedBrowsers.test(userAgent || getUserAgent() || "")
}
