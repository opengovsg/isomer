import type { BannerProps } from "@opengovsg/design-system-react"
import { useFeatureValue } from "@growthbook/growthbook-react"

import { BANNER_FEATURE_KEY } from "~/lib/growthbook"

type BannerFeature = Pick<BannerProps, "variant"> & {
  message: BannerProps["children"]
}
export const useBanner = () => {
  return useFeatureValue<BannerFeature | null>(BANNER_FEATURE_KEY, null)
}
