import { useFeatureValue } from "@growthbook/growthbook-react"

import { useMe } from "~/features/me/api"
import { ISOMER_ADMIN_FEATURE_KEY } from "~/lib/growthbook"

import "~/lib/growthbook"

export const useNewSettingsPage = () => {
  const {
    me: { email },
  } = useMe()

  const { enabledFor } = useFeatureValue<{ enabledFor: string[] }>(
    ISOMER_ADMIN_FEATURE_KEY,
    { enabledFor: [] },
  )

  return enabledFor.includes(email)
}
