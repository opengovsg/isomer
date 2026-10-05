import type { RefObject } from "react"
import { useEffect, useState } from "react"

const SCROLL_IDLE_MS = 150

/**
 * The table scroller whose horizontal scroll is in progress, or null once it
 * has settled. Vertical editor scroll does not count. Clears shortly after the
 * last horizontal scroll event so the elevation shadow does not stick.
 */
export const useTableHorizontalScrolling = (
  containerRef: RefObject<HTMLElement>,
): HTMLElement | null => {
  const [scroller, setScroller] = useState<HTMLElement | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const scrollLefts = new WeakMap<HTMLElement, number>()
    let idleTimer: number | undefined

    const onScroll = (event: Event) => {
      const target = event.target
      if (
        !(target instanceof HTMLElement) ||
        !target.hasAttribute("data-table-h-scroll")
      ) {
        return
      }
      const previous = scrollLefts.get(target)
      const next = target.scrollLeft
      scrollLefts.set(target, next)
      // A scroll event with no baseline is the first movement of this scroller.
      // Later events only count when scrollLeft actually changes.
      if (previous === next) return

      setScroller((current) => (current === target ? current : target))
      window.clearTimeout(idleTimer)
      idleTimer = window.setTimeout(() => setScroller(null), SCROLL_IDLE_MS)
    }

    container.addEventListener("scroll", onScroll, true)
    return () => {
      container.removeEventListener("scroll", onScroll, true)
      window.clearTimeout(idleTimer)
    }
  }, [containerRef])

  return scroller
}
