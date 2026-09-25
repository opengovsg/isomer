import type { GrowthBook } from "@growthbook/growthbook-react"
import { env } from "~/env.mjs"

export const ENABLE_CODEBUILD_JOBS = "enable-codebuild-jobs"
export const ENABLE_EMAILS_FOR_SCHEDULED_PUBLISHES_FEATURE_KEY =
  "enable-emails-for-scheduled-publishes"
export const ENABLE_EMAILS_FOR_REGULAR_PUBLISHES_FEATURE_KEY =
  "enable-emails-for-regular-publishes"
export const BANNER_FEATURE_KEY = "isomer-next-banner"
export const IS_SINGPASS_ENABLED_FEATURE_KEY = "is-singpass-enabled"
export const IS_HOMEPAGE_ANTI_SCAM_BANNER_ENABLED_FEATURE_KEY =
  "homepage-antiscam-banner-enabled"
export const EGAZETTE_INFO_FEATURE_KEY = "egazette-info"
// Gates the audit-log export surface (settings sidenav entry + page). OFF by
// default so the feature can ship dark and be enabled per-environment.
export const IS_AUDIT_LOG_ENABLED_FEATURE_KEY = "is-audit-log-enabled"
// When OFF (default): gazette ingestion targets Algolia directly.
// When ON: gazette ingestion is routed to SearchSG instead.
export const ENABLE_SEARCHSG_GAZETTE_INGESTION =
  "enable-searchsg-gazette-ingestion"
// Gates the whole unpublish feature: manual (unpublishPage, which also
// handles Folder/Collection ids) and scheduled (scheduleUnpublish/
// cancelScheduleUnpublish) alike, since the latter presupposes the former
// exists. OFF by default so the feature can ship dark and be enabled
// per-environment.
export const IS_UNPUBLISH_ENABLED_FEATURE_KEY = "is-unpublish-enabled"

// Gates the "Date filter" option when adding a new collection tag filter.
export const IS_DATE_FILTERS_ENABLED_FEATURE_KEY = "is-date-filters-enabled"
export const IS_DATE_FILTERS_ENABLED_FEATURE_KEY_FALLBACK_VALUE = false

// Gates the live Pair Foundry call. The value is the sites in the canary.
// An empty list is off everywhere. Widen `enabledSites` over time. To limit
// the canary to specific people, target their `email` in GrowthBook and serve
// this same shape — `email` is already a GrowthBook attribute.
export const ENABLE_AI_ALT_TEXT_GENERATION_FEATURE_KEY =
  "enable-ai-alt-text-generation"
export interface AiAltTextGenerationFeatureValue {
  enabledSites: string[]
}
export const ENABLE_AI_ALT_TEXT_GENERATION_FEATURE_KEY_FALLBACK_VALUE: AiAltTextGenerationFeatureValue =
  { enabledSites: [] }

export const isAiAltTextGenerationEnabledForSite = ({
  value,
  siteId,
}: {
  value: AiAltTextGenerationFeatureValue
  siteId: number
}): boolean => value.enabledSites.includes(siteId.toString())

export const getIsAiAltTextGenerationEnabled = ({
  gb,
  siteId,
}: {
  gb: GrowthBook
  siteId: number
}): boolean =>
  isAiAltTextGenerationEnabledForSite({
    value: gb.getFeatureValue(
      ENABLE_AI_ALT_TEXT_GENERATION_FEATURE_KEY,
      ENABLE_AI_ALT_TEXT_GENERATION_FEATURE_KEY_FALLBACK_VALUE,
    ),
    siteId,
  })

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
