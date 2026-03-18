import { useFeatureValue } from "@growthbook/growthbook-react"

import { IS_NEW_COLLECTION_EDITING_EXPERIENCE_ENABLED_FEATURE_KEY } from "~/lib/growthbook"

export const useNewCollectionEditingExperience = () =>
  useFeatureValue<boolean>(
    IS_NEW_COLLECTION_EDITING_EXPERIENCE_ENABLED_FEATURE_KEY,
    false,
  )
