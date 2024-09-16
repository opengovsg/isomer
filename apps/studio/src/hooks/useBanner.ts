import { useFeatureValue } from "@growthbook/growthbook-react"
import { BannerProps } from "@opengovsg/design-system-react"

type BannerFeature = {
  variant: BannerProps["variant"]
  message: BannerProps["children"] | string
}
const BANNER_FEATURE_KEY = "isomer-next-banner"
export const useBanner = () => {
  return useFeatureValue<BannerFeature | null>(BANNER_FEATURE_KEY, null)
}
