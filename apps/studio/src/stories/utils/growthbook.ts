import type { BannerProps } from "@opengovsg/design-system-react"
import { GrowthBook } from "@growthbook/growthbook"
import {
  BANNER_FEATURE_KEY,
  CATEGORY_DROPDOWN_FEATURE_KEY,
  CATEGORY_ID_DROPDOWN_FEATURE_KEY,
  EGAZETTE_INFO_FEATURE_KEY,
  IS_ADVANCED_REDIRECTS_ENABLED_FEATURE_KEY,
  IS_HOMEPAGE_ANTI_SCAM_BANNER_ENABLED_FEATURE_KEY,
  IS_SINGPASS_ENABLED_FEATURE_KEY,
} from "~/lib/growthbook"

export const createMockGrowthBook = (
  forcedFeatures?: Map<string, unknown>,
): GrowthBook => {
  const gb = new GrowthBook({
    // Setting features makes the GrowthBook instance ready immediately
    features: {},
  })
  if (forcedFeatures) {
    gb.setForcedFeatures(forcedFeatures)
  }
  return gb
}

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

export const createCategoryIdDropdownGbParameters = (siteId: string) => {
  return [CATEGORY_ID_DROPDOWN_FEATURE_KEY, { enabledSites: [siteId] }]
}

export const createSingpassEnabledGbParameters = (isEnabled: boolean) => {
  return [IS_SINGPASS_ENABLED_FEATURE_KEY, isEnabled]
}

export const createAdvancedRedirectsEnabledGbParameters = (
  isEnabled: boolean,
) => {
  return [IS_ADVANCED_REDIRECTS_ENABLED_FEATURE_KEY, isEnabled]
}

export const createAntiScamBannerEnabledGbParameters = (isEnabled: boolean) => {
  return [IS_HOMEPAGE_ANTI_SCAM_BANNER_ENABLED_FEATURE_KEY, isEnabled]
}

export const createEgazetteInfoGbParameters = ({
  siteId,
  gazettesCollectionId,
}: {
  siteId: string
  gazettesCollectionId: string
}) => {
  return [EGAZETTE_INFO_FEATURE_KEY, { siteId, gazettesCollectionId }]
}
