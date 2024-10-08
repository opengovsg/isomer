import type { BannerProps } from "@opengovsg/design-system-react"
import { useFeatureValue } from "@growthbook/growthbook-react"

type BannerFeature = Pick<BannerProps, "variant"> & {
  message: BannerProps["children"]
}
const BANNER_FEATURE_KEY = "isomer-next-banner"
export const useBanner = () => {
  return useFeatureValue<BannerFeature | null>(BANNER_FEATURE_KEY, null)
}
