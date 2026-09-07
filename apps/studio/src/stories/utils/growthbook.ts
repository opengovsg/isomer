import type { BannerProps } from "@opengovsg/design-system-react"
import { GrowthBook } from "@growthbook/growthbook"
import {
  BANNER_FEATURE_KEY,
  EGAZETTE_INFO_FEATURE_KEY,
  IS_AUDIT_LOG_ENABLED_FEATURE_KEY,
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
}) => [BANNER_FEATURE_KEY, { message, variant }]

export const createSingpassEnabledGbParameters = (isEnabled: boolean) => [
  IS_SINGPASS_ENABLED_FEATURE_KEY,
  isEnabled,
]

export const createAntiScamBannerEnabledGbParameters = (isEnabled: boolean) => [
  IS_HOMEPAGE_ANTI_SCAM_BANNER_ENABLED_FEATURE_KEY,
  isEnabled,
]

export const createAuditLogEnabledGbParameters = (isEnabled: boolean) => [
  IS_AUDIT_LOG_ENABLED_FEATURE_KEY,
  isEnabled,
]

export const createEgazetteInfoGbParameters = ({
  siteId,
  gazettesCollectionId,
}: {
  siteId: string
  gazettesCollectionId: string
}) => [EGAZETTE_INFO_FEATURE_KEY, { gazettesCollectionId, siteId }]
