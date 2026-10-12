import { useFeatureValue } from "@growthbook/growthbook-react"
import {
  IS_DATE_FILTERS_ENABLED_FEATURE_KEY,
  IS_DATE_FILTERS_ENABLED_FEATURE_KEY_FALLBACK_VALUE,
} from "~/lib/growthbook"

export const useDateFiltersEnabled = () =>
  useFeatureValue<boolean>(
    IS_DATE_FILTERS_ENABLED_FEATURE_KEY,
    IS_DATE_FILTERS_ENABLED_FEATURE_KEY_FALLBACK_VALUE,
  )
