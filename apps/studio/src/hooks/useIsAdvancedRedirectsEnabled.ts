import { useFeatureValue } from "@growthbook/growthbook-react"
import { IS_ADVANCED_REDIRECTS_ENABLED_FEATURE_KEY } from "~/lib/growthbook"

export const useIsAdvancedRedirectsEnabled = () =>
  useFeatureValue<boolean>(IS_ADVANCED_REDIRECTS_ENABLED_FEATURE_KEY, false)
