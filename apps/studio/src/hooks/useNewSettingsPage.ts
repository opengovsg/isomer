import { useFeatureValue } from "@growthbook/growthbook-react"

import { IS_NEW_SETTINGS_PAGE_ENABLED_FEATURE_KEY } from "~/lib/growthbook"

export const useNewSettingsPage = () =>
  useFeatureValue<boolean>(IS_NEW_SETTINGS_PAGE_ENABLED_FEATURE_KEY, false)
