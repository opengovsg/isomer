import type { BannerProps } from "@opengovsg/design-system-react"
import { useFeatureValue } from "@growthbook/growthbook-react"
import { BANNER_FEATURE_KEY } from "~/lib/growthbook"

export const APP_BANNER_ID = "app-banner"

export const getBannerHeightInPx = (): number => {
  return document.getElementById(APP_BANNER_ID)?.offsetHeight ?? 0
}

type BannerFeature = Pick<BannerProps, "variant"> & {
  // Rendered as markdown
  message: string
}
export const useBanner = () => {
  return useFeatureValue<BannerFeature | null>(BANNER_FEATURE_KEY, null)
}
