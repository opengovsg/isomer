import { useFeatureValue } from "@growthbook/growthbook-react"

import type { GrowthbookIsomerUsersFeature } from "~/lib/growthbook"
import { useMe } from "~/features/me/api"
import {
  ISOMER_ADMINS_AND_MIGRATORS_FEATURE_KEY,
  ISOMER_ADMINS_FEATURE_KEY,
} from "~/lib/growthbook"

interface UseIsUserIsomerUsersProps {
  includeMigrators: boolean
}

export const useIsUserIsomerUsers = ({
  includeMigrators,
}: UseIsUserIsomerUsersProps) => {
  const {
    me: { email },
  } = useMe()

  const { users } = useFeatureValue<GrowthbookIsomerUsersFeature>(
    includeMigrators
      ? ISOMER_ADMINS_AND_MIGRATORS_FEATURE_KEY
      : ISOMER_ADMINS_FEATURE_KEY,
    { users: [] },
  )

  return users.includes(email)
}
