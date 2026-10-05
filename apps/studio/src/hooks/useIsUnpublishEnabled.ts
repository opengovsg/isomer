import { useFeatureValue } from "@growthbook/growthbook-react"
import { IS_UNPUBLISH_ENABLED_FEATURE_KEY } from "~/lib/growthbook"

export const useIsUnpublishEnabled = () =>
  useFeatureValue<boolean>(IS_UNPUBLISH_ENABLED_FEATURE_KEY, false)
