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
  const skipSingpass = env.NEXT_PUBLIC_DANGEROUSLY_SKIP_SINGPASS

  return {
    // Whether to show the SingPass login option in the UI.
    isSingpassEnabled: !skipSingpass && featureValue,
    // Whether singpass-off side effects (e.g. email-on-publish) should activate.
    // False when SingPass is skipped (preview) even though SingPass is also
    // disabled there for the UI.
    isSingpassDisabledInNonPreview: !skipSingpass && !featureValue,
  }
}
