import { GrowthBook } from "@growthbook/growthbook"

import {
  IS_SINGPASS_ENABLED_FEATURE_KEY,
  IS_SINGPASS_ENABLED_FEATURE_KEY_FALLBACK_VALUE,
  IS_UNPUBLISH_ENABLED_FEATURE_KEY,
} from "./growthbook"

// Shared with the Vitest GrowthBook singleton. Unpublish is on here, unlike
// production, so test suites don't depend on the live flag. Tests that care
// about the flag force it off themselves.
export const mockFeatureFlags = new Map<string, unknown>([
  [
    IS_SINGPASS_ENABLED_FEATURE_KEY,
    IS_SINGPASS_ENABLED_FEATURE_KEY_FALLBACK_VALUE,
  ],
  [IS_UNPUBLISH_ENABLED_FEATURE_KEY, true],
])

// `init()` is what fetches https://cdn.growthbook.io, and it requires a client
// key. This instance never calls `init()`, so it takes neither.
export const createOfflineGrowthBook = (): GrowthBook => {
  const gb = new GrowthBook({
    features: {},
  })
  gb.setForcedFeatures(new Map(mockFeatureFlags))
  return gb
}
