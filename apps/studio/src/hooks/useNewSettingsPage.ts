import { useFeatureValue } from "@growthbook/growthbook-react"
import { ISOMER_ADMINS_AND_MIGRATORS_EMAILS } from "~prisma/constants"

import { useMe } from "~/features/me/api"
import { USE_NEW_SETTINGS_PAGE_FEATURE_KEY } from "~/lib/growthbook"

export const useNewSettingsPage = () => {
  const {
    me: { email },
  } = useMe()

  const { enabledFor } = useFeatureValue<{ enabledFor: string[] }>(
    USE_NEW_SETTINGS_PAGE_FEATURE_KEY,
    { enabledFor: ISOMER_ADMINS_AND_MIGRATORS_EMAILS },
  )

  return enabledFor.includes(email)
}
