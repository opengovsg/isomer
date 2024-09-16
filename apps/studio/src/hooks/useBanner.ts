import { useFeatureIsOn, useFeatureValue } from "@growthbook/growthbook-react"
import { BannerProps } from "@opengovsg/design-system-react"

type BannerFeature = {
  variant: BannerProps["variant"]
  message: BannerProps["children"] | string
}
const BANNER_FEATURE_KEY = "isomer-next-banner"
export const useBanner = () => {
  if (!useFeatureIsOn(BANNER_FEATURE_KEY)) {
    return null
  }

  return useFeatureValue<BannerFeature | null>(BANNER_FEATURE_KEY, null)
}
