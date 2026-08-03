import type { GrowthBook } from "@growthbook/growthbook-react"
import { env } from "~/env.mjs"

export const ENABLE_CODEBUILD_JOBS = "enable-codebuild-jobs"
export const ENABLE_EMAILS_FOR_SCHEDULED_PUBLISHES_FEATURE_KEY =
  "enable-emails-for-scheduled-publishes"
export const ENABLE_EMAILS_FOR_REGULAR_PUBLISHES_FEATURE_KEY =
  "enable-emails-for-regular-publishes"
export const BANNER_FEATURE_KEY = "isomer-next-banner"
export const IS_NEW_COLLECTION_TAGS_MANAGEMENT_ENABLED_FEATURE_KEY =
  "is-new-collection-tags-management-enabled"
export const IS_SINGPASS_ENABLED_FEATURE_KEY = "is-singpass-enabled"
export const IS_HOMEPAGE_ANTI_SCAM_BANNER_ENABLED_FEATURE_KEY =
  "homepage-antiscam-banner-enabled"
export const EGAZETTE_INFO_FEATURE_KEY = "egazette-info"
export const IS_ADVANCED_REDIRECTS_ENABLED_FEATURE_KEY =
  "is-advanced-redirects-enabled"
// When OFF (default): gazette ingestion targets Algolia directly.
// When ON: gazette ingestion is routed to SearchSG instead.
export const ENABLE_SEARCHSG_GAZETTE_INGESTION =
  "enable-searchsg-gazette-ingestion"

export const IS_SINGPASS_ENABLED_FEATURE_KEY_FALLBACK_VALUE = true

interface GetIsSingpassEnabledProps {
  gb: GrowthBook
}

export const getIsSingpassEnabled = ({
  gb,
}: GetIsSingpassEnabledProps): boolean => {
  if (env.NEXT_PUBLIC_DANGEROUSLY_SKIP_SINGPASS) return false
  return gb.getFeatureValue(
    IS_SINGPASS_ENABLED_FEATURE_KEY,
    IS_SINGPASS_ENABLED_FEATURE_KEY_FALLBACK_VALUE,
  )
}

// Whether singpass-off side effects (e.g. login alert email) should activate.
// False when SingPass is skipped (preview) even though SingPass is also
// disabled there.
export const getIsSingpassDisabledInNonPreview = ({
  gb,
}: GetIsSingpassEnabledProps): boolean => {
  if (env.NEXT_PUBLIC_DANGEROUSLY_SKIP_SINGPASS) return false
  return !gb.getFeatureValue(
    IS_SINGPASS_ENABLED_FEATURE_KEY,
    IS_SINGPASS_ENABLED_FEATURE_KEY_FALLBACK_VALUE,
  )
}
