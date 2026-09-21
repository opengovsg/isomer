import { useFeatureValue } from "@growthbook/growthbook-react"
import { IS_PREVIEW_BLOCK_HIGHLIGHT_ENABLED_FEATURE_KEY } from "~/lib/growthbook"

export const useIsPreviewBlockHighlightEnabled = (): boolean => {
  return useFeatureValue<boolean>(
    IS_PREVIEW_BLOCK_HIGHLIGHT_ENABLED_FEATURE_KEY,
    false,
  )
}
