import type { GrowthBook } from "@growthbook/growthbook-react"

export const BANNER_FEATURE_KEY = "isomer-next-banner"
export const ISOMER_ADMIN_FEATURE_KEY = "isomer_admins"
export const CATEGORY_DROPDOWN_FEATURE_KEY = "category-dropdown"
export const IS_SINGPASS_ENABLED_FEATURE_KEY = "is-singpass-enabled"
export const IS_SINGPASS_ENABLED_FEATURE_KEY_FALLBACK_VALUE = false

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

/**
 * TODO: Remove this once we officially launched Singpass login
 * Replace it to only use IS_SINGPASS_ENABLED_FEATURE_KEY
 *
 * This TEMPORARY feature flag is used to enable Singpass login for critical actions
 * such as adding, editing or removing users.
 *
 * This is to ensure that these actions are still accessible even if the
 * the changes have been deployed to production but we have not yet launched
 * Singpass login.
 */
export const IS_SINGPASS_ENABLED_FOR_CRITICAL_ACTIONS_FEATURE_KEY =
  "is-singpass-enabled-for-critical-actions"
export const IS_SINGPASS_ENABLED_FOR_CRITICAL_ACTIONS_FEATURE_KEY_FALLBACK_VALUE =
  true
export const getIsSingpassEnabledForCriticalActions = ({
  gb,
}: GetIsSingpassEnabledProps): boolean => {
  return gb.getFeatureValue(
    IS_SINGPASS_ENABLED_FOR_CRITICAL_ACTIONS_FEATURE_KEY,
    IS_SINGPASS_ENABLED_FOR_CRITICAL_ACTIONS_FEATURE_KEY_FALLBACK_VALUE,
  )
}
