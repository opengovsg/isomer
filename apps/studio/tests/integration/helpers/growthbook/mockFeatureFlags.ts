import { IS_SINGPASS_ENABLED_FEATURE_KEY } from "~/lib/growthbook"

const mockFeatureFlags = new Map<string, unknown>([
  [
    IS_SINGPASS_ENABLED_FEATURE_KEY,
    true, // For testing purposes, we always enable Singpass
  ],
])

export { mockFeatureFlags }
