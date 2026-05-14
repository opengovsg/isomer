import { useFeatureValue } from "@growthbook/growthbook-react"
import { IS_REDIRECTIONS_ENABLED_FEATURE_KEY } from "~/lib/growthbook"

export const useIsRedirectionsEnabled = () =>
  useFeatureValue<boolean>(IS_REDIRECTIONS_ENABLED_FEATURE_KEY, false)
