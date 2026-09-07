/* oxlint-disable typescript/no-unsafe-return -- studio lint cleanup */
import type { BannerProps } from "@opengovsg/design-system-react"
import { useFeatureValue } from "@growthbook/growthbook-react"
import { BANNER_FEATURE_KEY } from "~/lib/growthbook"

export const APP_BANNER_ID = "app-banner"

const getOffsetHeight = (element: Element | null): number =>
  element instanceof HTMLElement ? element.offsetHeight : 0

export const getBannerHeightInPx = (): number =>
  getOffsetHeight(document.querySelector(`#${APP_BANNER_ID}`))

type BannerFeature = Pick<BannerProps, "variant"> & {
  message: BannerProps["children"]
}
export const useBanner = () =>
  useFeatureValue<BannerFeature | null>(BANNER_FEATURE_KEY, null)
