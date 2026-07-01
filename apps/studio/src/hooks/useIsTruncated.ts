import { useCallback, useEffect, useRef, useState } from "react"

// Tracks whether an element's text is being clipped by CSS (e.g. noOfLines /
// ellipsis). A ResizeObserver keeps the value in sync as the cell resizes, so a
// tooltip can stay disabled until the content actually overflows. Uses a
// callback ref so measurement (re)attaches whenever the node mounts — e.g. after
// a cell swaps a Skeleton for its real content — and no-ops where ResizeObserver
// is unavailable (jsdom/older browsers).
export const useIsTruncated = <T extends HTMLElement>() => {
  const [isTruncated, setIsTruncated] = useState(false)
  const observerRef = useRef<ResizeObserver | null>(null)

  const ref = useCallback((element: T | null) => {
    observerRef.current?.disconnect()
    observerRef.current = null

    if (!element) return

    const measure = () => {
      setIsTruncated(
        element.scrollWidth > element.clientWidth ||
          element.scrollHeight > element.clientHeight,
      )
    }

    measure()
    if (typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    observerRef.current = observer
  }, [])

  useEffect(() => () => observerRef.current?.disconnect(), [])

  return { ref, isTruncated }
}
