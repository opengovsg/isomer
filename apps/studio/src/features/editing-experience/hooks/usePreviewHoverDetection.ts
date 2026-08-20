import type { IsomerSchema } from "@opengovsg/isomer-components"
import { useEffect } from "react"
import { CONTENT_BLOCKS_SELECTOR } from "~/features/editing-experience/constants"
import { getContentIndexFromDomIndex } from "~/features/editing-experience/utils/getBlockElement"

// Walks up to the direct child of the content-blocks container and returns
// its DOM position — a raw DOM index, not a `content` array index (hidden
// childrenpages blocks aren't rendered; see getBlockElement.ts for the map).
const resolveDomBlockIndex = (
  container: Element,
  target: EventTarget | null,
): number | null => {
  let node = target as Node | null
  while (node && node.parentElement !== container) {
    node = node.parentElement
  }
  // Not `instanceof HTMLElement`: react-frame-component portals into the
  // iframe's own document, whose nodes belong to a different realm.
  if (!node) return null

  const index = Array.prototype.indexOf.call(container.children, node)
  return index === -1 ? null : index
}

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

    // Cached across events rather than re-queried per mouseover/mouseout.
    let container = iframeDocument.querySelector(CONTENT_BLOCKS_SELECTOR)

    const handleMouseOver = (event: MouseEvent) => {
      container ??= iframeDocument.querySelector(CONTENT_BLOCKS_SELECTOR)
      if (!container) return

      const domIndex = resolveDomBlockIndex(container, event.target)
      if (domIndex === null) return

      const contentIndex = getContentIndexFromDomIndex(content, domIndex)
      if (contentIndex !== null) setHoveredBlockIndex(contentIndex)
    }

    const handleMouseOut = (event: MouseEvent) => {
      container ??= iframeDocument.querySelector(CONTENT_BLOCKS_SELECTOR)
      if (!container) return

      const related = event.relatedTarget as Node | null
      if (related && container.contains(related)) return

      // The hover toolbar is portaled as a sibling of `container`, not a
      // descendant, so moving onto it fires mouseout with `relatedTarget`
      // outside `container` — that would unmount the toolbar mid-hover and
      // loop (block reappears -> synthetic mouseover -> repeat). Treat
      // entering the toolbar as staying within the block.
      // Not `instanceof Element` — see the cross-realm note above.
      const relatedElement = event.relatedTarget as Element | null
      const enteredToolbar = relatedElement?.closest?.(
        "[data-isomer-preview-toolbar]",
      )
      if (enteredToolbar) return

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
