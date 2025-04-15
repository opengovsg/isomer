import {
  IS_SINGPASS_ENABLED_FEATURE_KEY,
  IS_SINGPASS_ENABLED_FEATURE_KEY_FALLBACK_VALUE,
} from "~/lib/growthbook"

const mockFeatureFlags = new Map<string, unknown>([
  [
    IS_SINGPASS_ENABLED_FEATURE_KEY,
    // For testing purposes, we always enable Singpass
    // TODO: Remove the inverse once we officially launched Singpass login
    !IS_SINGPASS_ENABLED_FEATURE_KEY_FALLBACK_VALUE,
  ],
])

export { mockFeatureFlags }
