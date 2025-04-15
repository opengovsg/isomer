import { useFeatureValue } from "@growthbook/growthbook-react"

import {
  IS_SINGPASS_ENABLED_FEATURE_KEY,
  IS_SINGPASS_ENABLED_FEATURE_KEY_FALLBACK_VALUE,
  IS_SINGPASS_ENABLED_FOR_CRITICAL_ACTIONS_FEATURE_KEY,
  IS_SINGPASS_ENABLED_FOR_CRITICAL_ACTIONS_FEATURE_KEY_FALLBACK_VALUE,
} from "~/lib/growthbook"

export const useIsSingpassEnabled = () =>
  useFeatureValue<boolean>(
    IS_SINGPASS_ENABLED_FEATURE_KEY,
    IS_SINGPASS_ENABLED_FEATURE_KEY_FALLBACK_VALUE,
  )

// TODO: Remove this once we officially launched Singpass login
// Replace it to only use useIsSingpassEnabled
export const useIsSingpassEnabledForCriticalActions = () =>
  useFeatureValue<boolean>(
    IS_SINGPASS_ENABLED_FOR_CRITICAL_ACTIONS_FEATURE_KEY,
    IS_SINGPASS_ENABLED_FOR_CRITICAL_ACTIONS_FEATURE_KEY_FALLBACK_VALUE,
  )
