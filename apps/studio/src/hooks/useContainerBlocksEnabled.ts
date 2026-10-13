import { useFeatureValue } from "@growthbook/growthbook-react"
import {
  IS_CONTAINER_BLOCKS_ENABLED_FEATURE_KEY,
  IS_CONTAINER_BLOCKS_ENABLED_FEATURE_KEY_FALLBACK_VALUE,
} from "~/lib/growthbook"

export const useContainerBlocksEnabled = () =>
  useFeatureValue<boolean>(
    IS_CONTAINER_BLOCKS_ENABLED_FEATURE_KEY,
    IS_CONTAINER_BLOCKS_ENABLED_FEATURE_KEY_FALLBACK_VALUE,
  )
