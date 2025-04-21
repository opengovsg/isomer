import { useFeatureValue } from "@growthbook/growthbook-react"

import type { GrowthbookIsomerAdminFeature } from "~/lib/growthbook"
import { useMe } from "~/features/me/api"
import { ADMIN_ROLE, ISOMER_ADMIN_FEATURE_KEY } from "~/lib/growthbook"

interface UseIsUserIsomerAdminProps {
  roles: (typeof ADMIN_ROLE)[keyof typeof ADMIN_ROLE][]
}

export const useIsUserIsomerAdmin = ({ roles }: UseIsUserIsomerAdminProps) => {
  const {
    me: { email },
  } = useMe()

  const { core, migrators } = useFeatureValue<GrowthbookIsomerAdminFeature>(
    ISOMER_ADMIN_FEATURE_KEY,
    { core: [], migrators: [] },
  )

  if (roles.includes(ADMIN_ROLE.CORE)) {
    return core.includes(email)
  }

  if (roles.includes(ADMIN_ROLE.MIGRATORS)) {
    return migrators.includes(email)
  }

  return false
}
