import { useFeatureValue } from "@growthbook/growthbook-react"
import { IS_NEW_COLLECTION_TAGS_MANAGEMENT_ENABLED_FEATURE_KEY } from "~/lib/growthbook"

export const useNewCollectionTagsManagement = () =>
  useFeatureValue<boolean>(
    IS_NEW_COLLECTION_TAGS_MANAGEMENT_ENABLED_FEATURE_KEY,
    false,
  )
