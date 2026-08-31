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
  hoveredBlockElement?: HTMLElement | null
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
  hoveredBlockElement,
  content,
}: UseBlockHighlightParams): UseBlockHighlightReturn => {
  const [rect, setRect] = useState<HighlightRect | null>(null)

  useEffect(() => {
    if (hoveredBlockIndex === null || !iframeDocument) {
      setRect(null)
      return
    }

    const blockEl =
      hoveredBlockElement ?? getBlockElement(iframeDocument, hoveredBlockIndex)

    if (!blockEl) {
      setRect(null)
      return
    }

    const updateRect = () => {
      const scrollX = iframeDocument.defaultView?.scrollX ?? 0
      const scrollY = iframeDocument.defaultView?.scrollY ?? 0
      const domRect = blockEl.getBoundingClientRect()

      setRect({
        top: domRect.top + scrollY,
        left: domRect.left + scrollX,
        width: domRect.width,
        height: domRect.height,
      })
    }

    updateRect()

    // Interacting with the block itself (e.g. expanding an Accordion) can
    // change its size without the hover target ever changing, so the rect
    // would otherwise go stale until the next mouseover/mouseout. Watch the
    // hovered block directly rather than re-querying on every layout change.
    const resizeObserver = new ResizeObserver(updateRect)
    resizeObserver.observe(blockEl)

    return () => {
      resizeObserver.disconnect()
    }
  }, [hoveredBlockIndex, hoveredBlockElement, iframeDocument, content])

  const block =
    hoveredBlockIndex !== null ? content[hoveredBlockIndex] : undefined

  const label = block
    ? block.type === "prose"
      ? PROSE_COMPONENT_NAME
      : (getComponentSchema({ component: block.type }).title ?? "Unknown")
    : undefined

  return { rect, label }
}
