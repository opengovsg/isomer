import type { GrowthBook } from "@growthbook/growthbook"

export const BANNER_FEATURE_KEY = "isomer-next-banner"
export const ISOMER_ADMIN_FEATURE_KEY = "isomer_admins"
export const CATEGORY_DROPDOWN_FEATURE_KEY = "category-dropdown"
export const IS_SINGPASS_ENABLED_FEATURE_KEY = "is-singpass-enabled"
export const IS_SINGPASS_ENABLED_FEATURE_KEY_FALLBACK_VALUE = false

interface IsSingpassEnabledProps {
  gb: GrowthBook
}
export const isSingpassEnabled = ({ gb }: IsSingpassEnabledProps): boolean => {
  return gb.getFeatureValue(
    IS_SINGPASS_ENABLED_FEATURE_KEY,
    IS_SINGPASS_ENABLED_FEATURE_KEY_FALLBACK_VALUE,
  )
}
