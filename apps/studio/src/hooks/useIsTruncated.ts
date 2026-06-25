import { useEffect, useRef, useState } from "react"

// Tracks whether an element's text is being clipped by CSS (e.g. noOfLines /
// ellipsis). A ResizeObserver keeps the value in sync as the cell resizes, so a
// tooltip can stay disabled until the content actually overflows.
export const useIsTruncated = <T extends HTMLElement>() => {
  const ref = useRef<T>(null)
  const [isTruncated, setIsTruncated] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const measure = () => {
      setIsTruncated(
        element.scrollWidth > element.clientWidth ||
          element.scrollHeight > element.clientHeight,
      )
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return { ref, isTruncated }
}
