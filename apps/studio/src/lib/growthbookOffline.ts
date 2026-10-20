import { GrowthBook } from "@growthbook/growthbook"

import {
  IS_SINGPASS_ENABLED_FEATURE_KEY,
  IS_SINGPASS_ENABLED_FEATURE_KEY_FALLBACK_VALUE,
} from "./growthbook"

export const mockFeatureFlags = new Map<string, unknown>([
  [
    IS_SINGPASS_ENABLED_FEATURE_KEY,
    IS_SINGPASS_ENABLED_FEATURE_KEY_FALLBACK_VALUE,
  ],
])

// Passing `features` marks the instance ready without a CDN fetch.
export const createOfflineGrowthBook = (): GrowthBook => {
  const gb = new GrowthBook({
    features: {},
  })
  gb.setForcedFeatures(new Map(mockFeatureFlags))
  return gb
}

/** Replace one forced flag and notify GrowthBook React subscribers. */
export const applyGrowthBookOverride = (
  gb: GrowthBook,
  key: string,
  value: unknown,
) => {
  const next = new Map(gb.getForcedFeatures())
  next.set(key, value)
  gb.setForcedFeatures(next)
}
