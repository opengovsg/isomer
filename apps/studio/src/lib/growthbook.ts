import type { GrowthBook } from "@growthbook/growthbook-react"

export const ENABLE_CODEBUILD_JOBS = "enable-codebuild-jobs"
export const ENABLE_EMAILS_FOR_SCHEDULED_PUBLISHES_FEATURE_KEY =
  "enable-emails-for-scheduled-publishes"
export const ENABLE_EMAILS_FOR_REGULAR_PUBLISHES_FEATURE_KEY =
  "enable-emails-for-regular-publishes"
export const BANNER_FEATURE_KEY = "isomer-next-banner"
export const IS_NEW_SETTINGS_PAGE_ENABLED_FEATURE_KEY =
  "is-new-settings-page-enabled"
export const IS_NEW_COLLECTION_EDITING_EXPERIENCE_ENABLED_FEATURE_KEY =
  "is-new-collection-editing-experience-enabled"
export const CATEGORY_DROPDOWN_FEATURE_KEY = "category-dropdown"
export const IS_SINGPASS_ENABLED_FEATURE_KEY = "is-singpass-enabled"
export const IS_HOMEPAGE_ANTI_SCAM_BANNER_ENABLED_FEATURE_KEY =
  "homepage-antiscam-banner-enabled"

export const IS_SINGPASS_ENABLED_FEATURE_KEY_FALLBACK_VALUE = true

interface GetIsSingpassEnabledProps {
  gb: GrowthBook
}

export const getIsSingpassEnabled = ({
  gb,
}: GetIsSingpassEnabledProps): boolean => {
  return gb.getFeatureValue(
    IS_SINGPASS_ENABLED_FEATURE_KEY,
    IS_SINGPASS_ENABLED_FEATURE_KEY_FALLBACK_VALUE,
  )
}
