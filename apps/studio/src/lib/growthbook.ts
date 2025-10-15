import type { GrowthBook } from "@growthbook/growthbook-react"

import { createGrowthBookContext } from "~/server/context"

export const SCHEDULED_PUBLISHING_SITES_FEATURE_KEY =
  "scheduled-publishing-sites"
export const ENABLE_EMAILS_FOR_SCHEDULED_PUBLISHES_FEATURE_KEY =
  "enable-emails-for-scheduled-publishes"
export const ENABLE_EMAILS_FOR_REGULAR_PUBLISHES_FEATURE_KEY =
  "enable-emails-for-regular-publishes"
export const BANNER_FEATURE_KEY = "isomer-next-banner"
export const ISOMER_ADMIN_FEATURE_KEY = "isomer_admins"
export const USE_NEW_SETTINGS_PAGE_FEATURE_KEY = "use-new-settings-page"
export const CATEGORY_DROPDOWN_FEATURE_KEY = "category-dropdown"
export const IS_SINGPASS_ENABLED_FEATURE_KEY = "is-singpass-enabled"
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

interface ScheduledPublishingSites {
  enabledSites: string[]
}

export const getIsScheduledPublishingEnabledForSite = async ({
  gb,
  siteId,
}: {
  gb?: GrowthBook
  siteId: number
}) => {
  // TODO: Initialise once since could introduce unnecessary latency
  gb = gb ?? (await createGrowthBookContext())
  const feature = gb.getFeatureValue<ScheduledPublishingSites>(
    SCHEDULED_PUBLISHING_SITES_FEATURE_KEY,
    {
      enabledSites: [],
    },
  )
  return feature.enabledSites.includes(siteId.toString())
}

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
