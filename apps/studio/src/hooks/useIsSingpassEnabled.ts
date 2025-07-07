import { useFeatureValue } from "@growthbook/growthbook-react"

import {
  IS_SINGPASS_ENABLED_FEATURE_KEY,
  IS_SINGPASS_ENABLED_FEATURE_KEY_FALLBACK_VALUE,
} from "~/lib/growthbook"
import { env } from "~/env.mjs"

export const useIsSingpassEnabled = () => {
  // Always disable SingPass in UAT environment
  if (env.NEXT_PUBLIC_APP_ENV === "uat") {
    return false
  }

  return useFeatureValue<boolean>(
    IS_SINGPASS_ENABLED_FEATURE_KEY,
    IS_SINGPASS_ENABLED_FEATURE_KEY_FALLBACK_VALUE,
  )
}
