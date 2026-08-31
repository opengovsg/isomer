import type { IsomerSchema } from "@opengovsg/isomer-components"
import { useEffect } from "react"
import { CONTENT_BLOCKS_SELECTOR } from "~/features/editing-experience/constants"
import { getContentIndexFromElement } from "~/features/editing-experience/utils/getBlockElement"

export const usePreviewHoverDetection = (
  iframeDocument: Document | null,
  content: IsomerSchema["content"],
  setHoveredBlockIndex: (index: number | null) => void,
): void => {
  useEffect(() => {
    if (!iframeDocument) return

    let container = iframeDocument.querySelector(CONTENT_BLOCKS_SELECTOR)

    const handleMouseOver = (event: MouseEvent) => {
      container ??= iframeDocument.querySelector(CONTENT_BLOCKS_SELECTOR)

      const contentIndex = getContentIndexFromElement(
        event.target as Element | null,
      )
      if (contentIndex !== null) setHoveredBlockIndex(contentIndex)
    }

    const handleMouseOut = (event: MouseEvent) => {
      container ??= iframeDocument.querySelector(CONTENT_BLOCKS_SELECTOR)
      if (!container) return

      const related = event.relatedTarget as Node | null
      if (related) {
        const fromIndex = getContentIndexFromElement(
          event.target as Element | null,
        )
        const toIndex = getContentIndexFromElement(related as Element | null)

        if (fromIndex !== null && fromIndex === toIndex) return
        if (container.contains(related)) return

        // The edit toolbar is portaled outside the content container; treat
        // moving onto it as staying within the hovered block.
        const relatedElement = related as Element | null
        const enteredToolbar = relatedElement?.closest?.(
          "[data-isomer-preview-toolbar]",
        )
        if (enteredToolbar) return
      }

      setHoveredBlockIndex(null)
    }

    iframeDocument.addEventListener("mouseover", handleMouseOver)
    iframeDocument.addEventListener("mouseout", handleMouseOut)

    return () => {
      iframeDocument.removeEventListener("mouseover", handleMouseOver)
      iframeDocument.removeEventListener("mouseout", handleMouseOut)
    }
  }, [iframeDocument, content, setHoveredBlockIndex])
}
