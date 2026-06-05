import { useFeatureValue } from "@growthbook/growthbook-react"
import { env } from "~/env.mjs"
import {
  IS_SINGPASS_ENABLED_FEATURE_KEY,
  IS_SINGPASS_ENABLED_FEATURE_KEY_FALLBACK_VALUE,
} from "~/lib/growthbook"

export const useIsSingpassEnabled = () => {
  const featureValue = useFeatureValue<boolean>(
    IS_SINGPASS_ENABLED_FEATURE_KEY,
    IS_SINGPASS_ENABLED_FEATURE_KEY_FALLBACK_VALUE,
  )
  const isPreview = env.NEXT_PUBLIC_APP_ENV === "preview"

  return {
    // Whether to show the SingPass login option in the UI.
    isSingpassEnabled: !isPreview && featureValue,
    // Whether singpass-off side effects (e.g. email-on-publish) should activate.
    // False in preview even though SingPass is also disabled there for the UI.
    isSingpassDisabledInNonPreview: !isPreview && !featureValue,
  }
}
