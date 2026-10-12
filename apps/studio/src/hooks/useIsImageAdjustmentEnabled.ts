import { useFeatureValue } from "@growthbook/growthbook-react"
import {
  IS_IMAGE_ADJUSTMENT_ENABLED_FEATURE_KEY,
  IS_IMAGE_ADJUSTMENT_ENABLED_FEATURE_KEY_FALLBACK_VALUE,
} from "~/lib/growthbook"

// Canary per agency: image adjustment is enabled only for sites in the flag's
// enabledSites list. Safe fallback is off everywhere (empty list).
export const useIsImageAdjustmentEnabled = (siteId: number): boolean => {
  const { enabledSites } = useFeatureValue(
    IS_IMAGE_ADJUSTMENT_ENABLED_FEATURE_KEY,
    IS_IMAGE_ADJUSTMENT_ENABLED_FEATURE_KEY_FALLBACK_VALUE,
  )
  return enabledSites.includes(siteId.toString())
}
