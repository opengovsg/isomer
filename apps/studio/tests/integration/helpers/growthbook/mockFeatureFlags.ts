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
  // ON by default in tests (OFF in production) so existing coverage
  // doesn't need to know the flag exists.
  [IS_UNPUBLISH_ENABLED_FEATURE_KEY, true],
])

export { mockFeatureFlags }
