import { useFeatureValue } from "@growthbook/growthbook-react"

import { env } from "~/env.mjs"
import {
  IS_SINGPASS_ENABLED_FEATURE_KEY,
  IS_SINGPASS_ENABLED_FEATURE_KEY_FALLBACK_VALUE,
} from "~/lib/growthbook"

export const useIsSingpassEnabled = () =>
  useFeatureValue<boolean>(
    IS_SINGPASS_ENABLED_FEATURE_KEY,
    IS_SINGPASS_ENABLED_FEATURE_KEY_FALLBACK_VALUE,
  )

// Temporary as Singpass is live for VAPT
// Once VAPT is done and we are releasing to other environments,
// we can remove this check and use useIsSingpassEnabled directly
export const useIsSingpassEnabledForCriticalActions = () => {
  const isSingpassEnabled = useIsSingpassEnabled()
  return env.NEXT_PUBLIC_APP_ENV !== "vapt" ? true : isSingpassEnabled
}
