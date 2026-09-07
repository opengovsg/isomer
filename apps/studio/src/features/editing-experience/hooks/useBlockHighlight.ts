/* oxlint-disable unicorn/no-nested-ternary -- core cleanup deferred */
import type { IsomerSchema } from "@opengovsg/isomer-components"
import { getComponentSchema } from "@opengovsg/isomer-components"
import { useEffect, useState } from "react"
import { PROSE_COMPONENT_NAME } from "~/constants/formBuilder"
import { getBlockElement } from "~/features/editing-experience/utils/getBlockElement"

interface HighlightRect {
  top: number
  left: number
  width: number
  height: number
}

interface UseBlockHighlightParams {
  iframeDocument: Document | null
  hoveredBlockIndex: number | null
  content: IsomerSchema["content"]
}

interface UseBlockHighlightReturn {
  rect: HighlightRect | null
  label: string | undefined
}

// Computes where (and what) to render for the currently hovered block's
// highlight overlay in the preview iframe.
export const useBlockHighlight = ({
  iframeDocument,
  hoveredBlockIndex,
  content,
}: UseBlockHighlightParams): UseBlockHighlightReturn => {
  const [rect, setRect] = useState<HighlightRect | null>(null)
  const shouldTrack = hoveredBlockIndex !== null && iframeDocument !== null

  useEffect(() => {
    // oxlint-disable-next-line typescript/strict-boolean-expressions -- core cleanup deferred
    if (!shouldTrack || hoveredBlockIndex === null || !iframeDocument) {
      return
    }

    const blockEl = getBlockElement(iframeDocument, content, hoveredBlockIndex)

    if (!blockEl) {
      return
    }

    const updateRect = () => {
      const scrollX = iframeDocument.defaultView?.scrollX ?? 0
      const scrollY = iframeDocument.defaultView?.scrollY ?? 0
      const domRect = blockEl.getBoundingClientRect()

      setRect({
        height: domRect.height,
        left: domRect.left + scrollX,
        top: domRect.top + scrollY,
        width: domRect.width,
      })
    }

    updateRect()

    // Interacting with the block itself (e.g. expanding an Accordion) can
    // change its size without the hover target ever changing, so the rect
    // would otherwise go stale until the next mouseover/mouseout. Watch the
    // hovered block directly rather than re-querying on every layout change.
    const resizeObserver = new ResizeObserver(updateRect)
    resizeObserver.observe(blockEl)

    // oxlint-disable-next-line typescript/consistent-return -- core cleanup deferred
    return () => {
      resizeObserver.disconnect()
    }
  }, [shouldTrack, hoveredBlockIndex, iframeDocument, content])

  const block =
    hoveredBlockIndex === null ? undefined : content[hoveredBlockIndex]

  // oxlint-disable-next-line eslint/no-nested-ternary -- core cleanup deferred
  const label = block
    ? block.type === "prose"
      ? PROSE_COMPONENT_NAME
      : (getComponentSchema({ component: block.type }).title ?? "Unknown")
    : undefined

  return { label, rect: shouldTrack ? rect : null }
}
