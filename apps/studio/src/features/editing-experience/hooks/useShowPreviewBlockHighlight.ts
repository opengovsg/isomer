import { useEffect } from "react"
import { useFeatureValue } from "@growthbook/growthbook-react"
import { useEditorDrawerContext } from "~/contexts/EditorDrawerContext"
import { IS_PREVIEW_BLOCK_HIGHLIGHT_ENABLED_FEATURE_KEY } from "~/lib/growthbook"

// Whether preview ↔ drawer block highlighting is active (GrowthBook flag and
// not in full-screen preview).
export const useShowPreviewBlockHighlight = (): boolean => {
  const { previewViewport, setHoveredBlockIndex } = useEditorDrawerContext()
  const isFeatureEnabled = useFeatureValue<boolean>(
    IS_PREVIEW_BLOCK_HIGHLIGHT_ENABLED_FEATURE_KEY,
    false,
  )
  const showPreviewBlockHighlight =
    isFeatureEnabled && previewViewport !== "fullscreen"

  useEffect(() => {
    if (!showPreviewBlockHighlight) {
      setHoveredBlockIndex(null)
    }
  }, [showPreviewBlockHighlight, setHoveredBlockIndex])

  return showPreviewBlockHighlight
}
