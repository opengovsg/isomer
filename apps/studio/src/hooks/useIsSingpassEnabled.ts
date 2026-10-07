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
  // Same reason as getIsSingpassEnabled: the client flag arrives after first
  // paint, so the OTP success handler must not race the CDN.
  const singpassOnInTestApp = env.NEXT_PUBLIC_APP_ENV === "test"

  return {
    // Whether to show the SingPass login option in the UI.
    isSingpassEnabled: !skipSingpass && (singpassOnInTestApp || featureValue),
    // Whether singpass-off side effects (e.g. email-on-publish) should activate.
    // False when SingPass is skipped (preview) even though SingPass is also
    // disabled there for the UI.
    isSingpassDisabledInNonPreview:
      !skipSingpass && !singpassOnInTestApp && !featureValue,
  }
}
