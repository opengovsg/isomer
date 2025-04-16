import { useFeatureValue } from "@growthbook/growthbook-react"

import { IS_SINGPASS_ENABLED_FEATURE_KEY } from "~/lib/growthbook"

export const useIsSingpassEnabled = () =>
  useFeatureValue<boolean>(IS_SINGPASS_ENABLED_FEATURE_KEY, false)
