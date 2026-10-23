import { useFeatureValue } from "@growthbook/growthbook-react"
import {
  IS_IMAGE_ADJUSTMENT_ENABLED_FEATURE_KEY,
  IS_IMAGE_ADJUSTMENT_ENABLED_FEATURE_KEY_FALLBACK_VALUE,
} from "~/lib/growthbook"

// Boolean On/Off flag, OFF by default; rollout is controlled per-user via
// GrowthBook targeting rules rather than a site list.
export const useIsImageAdjustmentEnabled = (): boolean => {
  return useFeatureValue<boolean>(
    IS_IMAGE_ADJUSTMENT_ENABLED_FEATURE_KEY,
    IS_IMAGE_ADJUSTMENT_ENABLED_FEATURE_KEY_FALLBACK_VALUE,
  )
}
