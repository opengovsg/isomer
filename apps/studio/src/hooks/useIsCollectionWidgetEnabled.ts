import { useFeatureValue } from "@growthbook/growthbook-react"

import {
  COLLECTION_WIDGET_ENABLED_FEATURE_KEY,
  COLLECTION_WIDGET_ENABLED_FEATURE_KEY_FALLBACK_VALUE,
} from "~/lib/growthbook"

export const useIsCollectionWidgetEnabled = () =>
  useFeatureValue<boolean>(
    COLLECTION_WIDGET_ENABLED_FEATURE_KEY,
    COLLECTION_WIDGET_ENABLED_FEATURE_KEY_FALLBACK_VALUE,
  )