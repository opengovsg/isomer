import { GrowthBook } from "@growthbook/growthbook"

import {
  IS_SINGPASS_ENABLED_FEATURE_KEY,
  IS_SINGPASS_ENABLED_FEATURE_KEY_FALLBACK_VALUE,
  IS_UNPUBLISH_ENABLED_FEATURE_KEY,
} from "./growthbook"

// Unpublish is on so existing tests don't have to know the flag exists.
// Tests for the flag force it off.
export const mockFeatureFlags = new Map<string, unknown>([
  [
    IS_SINGPASS_ENABLED_FEATURE_KEY,
    IS_SINGPASS_ENABLED_FEATURE_KEY_FALLBACK_VALUE,
  ],
  [IS_UNPUBLISH_ENABLED_FEATURE_KEY, true],
])

// Passing `features` marks the instance ready without a CDN fetch.
export const createOfflineGrowthBook = (): GrowthBook => {
  const gb = new GrowthBook({
    features: {},
  })
  gb.setForcedFeatures(new Map(mockFeatureFlags))
  return gb
}
