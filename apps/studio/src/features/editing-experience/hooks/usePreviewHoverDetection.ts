import { useEffect } from "react"

const CONTENT_BLOCKS_SELECTOR = "[data-isomer-content-blocks]"

// Resolve which block (if any) a mouse event target belongs to by walking up
// to the direct child of the shared content-blocks container.
const resolveBlockIndex = (
  container: Element,
  target: EventTarget | null,
): number | null => {
  let node = target as Node | null
  while (node && node.parentElement !== container) {
    node = node.parentElement
  }
  // NOTE: Deliberately not `instanceof HTMLElement` — react-frame-component
  // portals content into the iframe's own document, so DOM nodes there are
  // instances of the iframe's own HTMLElement global, not this window's.
  // `instanceof` checks against the parent realm's class silently fail.
  if (!node) return null

  const index = Array.prototype.indexOf.call(container.children, node)
  return index === -1 ? null : index
}

// Tracks which block the cursor is over inside the preview iframe, so the
// sidebar can mirror the highlight (the reverse of hovering a sidebar row to
// highlight the preview). Hand-rolled rather than usehooks-ts's
// `useEventListener`: that hook only re-subscribes when its `element` ref's
// *identity* changes, not when `.current` does — since `iframeDocument`
// starts `null` and is only set once the iframe finishes mounting, it would
// permanently miss the real target and fall back to `window`.
export const usePreviewHoverDetection = (
  iframeDocument: Document | null,
  setHoveredBlockIndex: (index: number | null) => void,
): void => {
  useEffect(() => {
    if (!iframeDocument) return

    const handleMouseOver = (event: MouseEvent) => {
      const container = iframeDocument.querySelector(CONTENT_BLOCKS_SELECTOR)
      if (!container) return

      const index = resolveBlockIndex(container, event.target)
      if (index !== null) setHoveredBlockIndex(index)
    }

    const handleMouseOut = (event: MouseEvent) => {
      const container = iframeDocument.querySelector(CONTENT_BLOCKS_SELECTOR)
      if (!container) return

      const related = event.relatedTarget as Node | null
      if (related && container.contains(related)) return

      // The hover toolbar (Edit button + label pill) is portaled directly
      // into `iframeDocument.body` as a sibling of the content-blocks
      // container, not a descendant of it — see BlockHighlightOverlay.tsx.
      // Moving the cursor onto the toolbar therefore fires `mouseout` on the
      // block with `relatedTarget` outside `container`, which would clear
      // the highlight and unmount the toolbar out from under the cursor.
      // That exposes the block underneath again, the browser re-runs hit
      // testing, and a synthetic `mouseover` fires without real cursor
      // movement — restarting the cycle as an infinite flicker loop. Treat
      // entering the toolbar the same as staying within the block.
      // NOTE: Deliberately not `instanceof Element` — see the note above
      // about react-frame-component portaling into the iframe's own
      // document; `instanceof` against the parent realm's class silently
      // fails here too.
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
  }, [iframeDocument, setHoveredBlockIndex])
}
