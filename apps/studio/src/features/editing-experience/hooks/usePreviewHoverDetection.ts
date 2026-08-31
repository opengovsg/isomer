import type { IsomerSchema } from "@opengovsg/isomer-components"
import type { Dispatch, SetStateAction } from "react"
import { useEffect } from "react"
import {
  CONTENT_BLOCK_INDEX_ATTR,
  CONTENT_BLOCKS_SELECTOR,
} from "~/features/editing-experience/constants"
import { getContentIndexFromElement } from "~/features/editing-experience/utils/getBlockElement"

export const usePreviewHoverDetection = (
  iframeDocument: Document | null,
  content: IsomerSchema["content"],
  setHoveredBlockIndex: (index: number | null) => void,
  setHoveredBlockElement?: Dispatch<SetStateAction<HTMLElement | null>>,
): void => {
  useEffect(() => {
    if (!iframeDocument) return

    let container = iframeDocument.querySelector(CONTENT_BLOCKS_SELECTOR)

    const handleMouseOver = (event: MouseEvent) => {
      container ??= iframeDocument.querySelector(CONTENT_BLOCKS_SELECTOR)

      const target = event.target as Element | null
      const contentIndex = getContentIndexFromElement(target)
      if (contentIndex === null) return

      setHoveredBlockIndex(contentIndex)
      setHoveredBlockElement?.(
        target?.closest<HTMLElement>(`[${CONTENT_BLOCK_INDEX_ATTR}]`) ?? null,
      )
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
      setHoveredBlockElement?.(null)
    }

    iframeDocument.addEventListener("mouseover", handleMouseOver)
    iframeDocument.addEventListener("mouseout", handleMouseOut)

    return () => {
      iframeDocument.removeEventListener("mouseover", handleMouseOver)
      iframeDocument.removeEventListener("mouseout", handleMouseOut)
    }
  }, [iframeDocument, content, setHoveredBlockIndex, setHoveredBlockElement])
}
