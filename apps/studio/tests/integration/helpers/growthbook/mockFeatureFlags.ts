import {
  IS_SINGPASS_ENABLED_FEATURE_KEY,
  IS_SINGPASS_ENABLED_FEATURE_KEY_FALLBACK_VALUE,
  IS_UNPUBLISH_ENABLED_FEATURE_KEY,
} from "~/lib/growthbook"

const mockFeatureFlags = new Map<string, unknown>([
  [
    IS_SINGPASS_ENABLED_FEATURE_KEY,
    IS_SINGPASS_ENABLED_FEATURE_KEY_FALLBACK_VALUE,
  ],
  // ON by default in tests, unlike production, so existing unpublish
  // coverage doesn't need to know the flag exists — tests for the flag
  // itself explicitly force it off.
  [IS_UNPUBLISH_ENABLED_FEATURE_KEY, true],
])

export { mockFeatureFlags }
