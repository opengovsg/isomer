import type { RefObject } from "react"
import { useEffect } from "react"

interface UseSyncedScrollParams {
  // Each pane wraps one preview iframe; the iframe's own window is what
  // scrolls.
  beforePaneRef: RefObject<HTMLElement>
  afterPaneRef: RefObject<HTMLElement>
  // The iframes' documents, as handed over by `PreviewIframe`. Scroll
  // listeners are (re)attached once both are available, since listeners on
  // an iframe's window don't survive it loading a new document.
  beforeDocument: Document | null
  afterDocument: Document | null
}

const getPaneWindow = (paneRef: RefObject<HTMLElement>) =>
  paneRef.current?.querySelector("iframe")?.contentWindow ?? null

/**
 * Keeps two preview iframes at the same scroll position: scrolling either
 * one scrolls the other to match.
 */
export function useSyncedScroll({
  beforePaneRef,
  afterPaneRef,
  beforeDocument,
  afterDocument,
}: UseSyncedScrollParams): void {
  useEffect(() => {
    if (!beforeDocument || !afterDocument) return

    const beforeWindow = getPaneWindow(beforePaneRef)
    const afterWindow = getPaneWindow(afterPaneRef)
    if (!beforeWindow || !afterWindow) return

    // The window we just scrolled programmatically. Its resulting scroll
    // event is skipped so it doesn't echo back to the window the user is
    // scrolling.
    let syncedWindow: Window | null = null

    const syncFrom = (source: Window, target: Window) => () => {
      if (syncedWindow === source) {
        syncedWindow = null
        return
      }
      if (
        target.scrollX === source.scrollX &&
        target.scrollY === source.scrollY
      ) {
        return
      }
      syncedWindow = target
      target.scrollTo(source.scrollX, source.scrollY)
    }

    const onBeforeScroll = syncFrom(beforeWindow, afterWindow)
    const onAfterScroll = syncFrom(afterWindow, beforeWindow)
    beforeWindow.addEventListener("scroll", onBeforeScroll)
    afterWindow.addEventListener("scroll", onAfterScroll)

    return () => {
      beforeWindow.removeEventListener("scroll", onBeforeScroll)
      afterWindow.removeEventListener("scroll", onAfterScroll)
    }
  }, [beforePaneRef, afterPaneRef, beforeDocument, afterDocument])
}
