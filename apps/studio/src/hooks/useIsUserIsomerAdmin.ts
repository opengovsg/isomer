import { useFeatureValue } from "@growthbook/growthbook-react"

import type { GrowthbookIsomerUsersFeature } from "~/lib/growthbook"
import { useMe } from "~/features/me/api"
import { ISOMER_ADMIN_FEATURE_KEY } from "~/lib/growthbook"

export const useIsUserIsomerAdmin = () => {
  const {
    me: { email },
  } = useMe()
  const { users } = useFeatureValue<GrowthbookIsomerUsersFeature>(
    ISOMER_ADMIN_FEATURE_KEY,
    { users: [] },
  )

  return users.includes(email)
}
