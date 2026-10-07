import { GrowthBook } from "@growthbook/growthbook"

import {
  IS_SINGPASS_ENABLED_FEATURE_KEY,
  IS_SINGPASS_ENABLED_FEATURE_KEY_FALLBACK_VALUE,
  IS_UNPUBLISH_ENABLED_FEATURE_KEY,
} from "./growthbook"

// Shared with the Vitest GrowthBook singleton. Unpublish is on here, unlike
// production, so test suites don't depend on the live flag. Tests that care
// about the flag force it off themselves.
export const testGrowthBookFeatures = new Map<string, unknown>([
  [
    IS_SINGPASS_ENABLED_FEATURE_KEY,
    IS_SINGPASS_ENABLED_FEATURE_KEY_FALLBACK_VALUE,
  ],
  [IS_UNPUBLISH_ENABLED_FEATURE_KEY, true],
])

// `init()` fetches https://cdn.growthbook.io. Tests pass `features` so the
// instance is ready immediately, then force the map above. No `init()` call.
export const createOfflineGrowthBook = (clientKey?: string): GrowthBook => {
  const gb = new GrowthBook({
    apiHost: "https://cdn.growthbook.io",
    clientKey,
    features: {},
  })
  gb.setForcedFeatures(new Map(testGrowthBookFeatures))
  return gb
}
