import type { IsomerSchema } from "@opengovsg/isomer-components"
import { useEffect } from "react"
import { CONTENT_BLOCKS_SELECTOR } from "~/features/editing-experience/constants"
import { getContentIndexFromElement } from "~/features/editing-experience/utils/getBlockElement"

// Tracks which block the cursor is over inside the preview iframe (the
// reverse of hovering a sidebar row). Hand-rolled instead of usehooks-ts's
// `useEventListener`, which only re-subscribes on `element` ref identity
// change, not `.current` change — misses `iframeDocument` going null -> set.
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

        // Moving between elements inside the same block (e.g. prose items).
        if (fromIndex !== null && fromIndex === toIndex) return

        // Another block inside the container — mouseover will update the index.
        if (container.contains(related)) return

        // The hover toolbar is portaled as a sibling of the content container,
        // not a descendant, so moving onto it fires mouseout with
        // `relatedTarget` outside the block — that would unmount the toolbar
        // mid-hover and loop (block reappears -> synthetic mouseover -> repeat).
        // Treat entering the toolbar as staying within the block.
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
