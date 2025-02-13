import type { BannerProps } from "@opengovsg/design-system-react"

import {
  BANNER_FEATURE_KEY,
  CATEGORY_DROPDOWN_FEATURE_KEY,
} from "~/lib/growthbook"

export const createBannerGbParameters = ({
  variant,
  message,
}: {
  variant: BannerProps["variant"]
  message: string
}) => {
  return [BANNER_FEATURE_KEY, { variant, message }]
}
export const createDropdownGbParameters = (siteId: string) => {
  return [CATEGORY_DROPDOWN_FEATURE_KEY, { enabledSites: [siteId] }]
}
