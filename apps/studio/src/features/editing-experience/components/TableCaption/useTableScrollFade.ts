import type { RefObject } from "react"
import { useLayoutEffect, useState } from "react"

import type { ScrollFadeEdges } from "./tableScrollFade"
import { scrollFadeEdges } from "./tableScrollFade"

const NONE: ScrollFadeEdges = { start: false, end: false }

export const useTableScrollFade = (
  ref: RefObject<HTMLElement | null>,
  layoutKey: string,
) => {
  const [edges, setEdges] = useState<ScrollFadeEdges>(NONE)

  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return

    const update = () => {
      const next = scrollFadeEdges(element)
      setEdges((current) =>
        current.start === next.start && current.end === next.end
          ? current
          : next,
      )
    }

    update()
    element.addEventListener("scroll", update, { passive: true })
    const observer = new ResizeObserver(update)
    observer.observe(element)
    const content = element.firstElementChild
    if (content) observer.observe(content)

    return () => {
      element.removeEventListener("scroll", update)
      observer.disconnect()
    }
  }, [ref, layoutKey])

  return edges
}
