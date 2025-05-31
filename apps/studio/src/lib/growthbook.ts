export const BANNER_FEATURE_KEY = "isomer-next-banner"
export const ISOMER_ADMIN_FEATURE_KEY = "isomer_admins"
export const CATEGORY_DROPDOWN_FEATURE_KEY = "category-dropdown"
export const IS_SINGPASS_ENABLED_FEATURE_KEY = "is-singpass-enabled"
export const IS_SINGPASS_ENABLED_FEATURE_KEY_FALLBACK_VALUE = false

// Growthbook has a constraint in the typings that requires the index signature
// of the object to be defined as a string instead of being specific to the keys
// that we want. Hence, we have to define it as a type instead of an interface.
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type GrowthbookIsomerAdminFeature = {
  [ADMIN_ROLE.CORE]: string[]
  [ADMIN_ROLE.MIGRATORS]: string[]
}

export const ADMIN_ROLE = {
  CORE: "core",
  MIGRATORS: "migrators",
} as const
