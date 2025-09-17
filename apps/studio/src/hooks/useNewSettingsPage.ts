import { useFeatureValue } from "@growthbook/growthbook-react"

import { useMe } from "~/features/me/api"
import { USE_NEW_SETTINGS_PAGE_FEATURE_KEY } from "~/lib/growthbook"

import "~/lib/growthbook"

import { ISOMER_ADMINS } from "~prisma/constants"

export const useNewSettingsPage = () => {
  const {
    me: { email },
  } = useMe()

  const { enabledFor } = useFeatureValue<{ enabledFor: string[] }>(
    USE_NEW_SETTINGS_PAGE_FEATURE_KEY,
    { enabledFor: ISOMER_ADMINS },
  )

  return enabledFor.includes(email)
}
