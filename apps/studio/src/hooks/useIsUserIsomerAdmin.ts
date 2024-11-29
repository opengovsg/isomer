import { useFeatureValue } from "@growthbook/growthbook-react"

import { useMe } from "~/features/me/api"
import { ISOMER_ADMIN_FEATURE_KEY } from "~/lib/growthbook"

// Growthbook has a constraint in the typings that requires the index signature
// of the object to be defined as a string instead of being specific to the keys
// that we want. Hence, we have to define it as a type instead of an interface.
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
type GrowthbookIsomerAdminFeature = {
  users: string[]
}

export const useIsUserIsomerAdmin = () => {
  const {
    me: { email },
  } = useMe()
  const { users } = useFeatureValue<GrowthbookIsomerAdminFeature>(
    ISOMER_ADMIN_FEATURE_KEY,
    { users: [] },
  )

  return users.includes(email)
}
