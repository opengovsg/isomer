import type { IsomerSchema } from "@opengovsg/isomer-components"
import type { BlockHighlightRect } from "~/features/editing-experience/utils/getBlockElement"
import { getComponentSchema } from "@opengovsg/isomer-components"
import { useEffect, useState } from "react"
import { PROSE_COMPONENT_NAME } from "~/constants/formBuilder"
import {
  getBlockElements,
  getBlockHighlightRect,
} from "~/features/editing-experience/utils/getBlockElement"

interface UseBlockHighlightParams {
  iframeDocument: Document | null
  hoveredBlockIndex: number | null
  content: IsomerSchema["content"]
}

interface UseBlockHighlightReturn {
  rect: BlockHighlightRect | null
  label: string | undefined
}

// Computes where (and what) to render for the currently hovered block's
// highlight overlay in the preview iframe. Multi-node blocks (e.g. prose)
// share one overlay covering every stamped node.
export const useBlockHighlight = ({
  iframeDocument,
  hoveredBlockIndex,
  content,
}: UseBlockHighlightParams): UseBlockHighlightReturn => {
  const [rect, setRect] = useState<BlockHighlightRect | null>(null)

  useEffect(() => {
    if (hoveredBlockIndex === null || !iframeDocument) {
      setRect(null)
      return
    }

    const blockEls = getBlockElements(iframeDocument, hoveredBlockIndex)

    if (blockEls.length === 0) {
      setRect(null)
      return
    }

    const updateRect = () => {
      setRect(getBlockHighlightRect(iframeDocument, hoveredBlockIndex) ?? null)
    }

    updateRect()

    // Interacting with the block itself (e.g. expanding an Accordion) can
    // change its size without the hover target ever changing, so the rect
    // would otherwise go stale until the next mouseover/mouseout. Watch every
    // stamped node — a prose block is several siblings, not one wrapper.
    const resizeObserver = new ResizeObserver(updateRect)
    for (const el of blockEls) {
      resizeObserver.observe(el)
    }

    return () => {
      resizeObserver.disconnect()
    }
  }, [hoveredBlockIndex, iframeDocument, content])

  const block =
    hoveredBlockIndex !== null ? content[hoveredBlockIndex] : undefined

  const label = block
    ? block.type === "prose"
      ? PROSE_COMPONENT_NAME
      : (getComponentSchema({ component: block.type }).title ?? "Unknown")
    : undefined

  return { rect, label }
}
