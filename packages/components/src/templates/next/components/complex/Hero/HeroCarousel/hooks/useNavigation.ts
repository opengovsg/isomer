import { useCallback, useState, useTransition } from "react"

import { useHeroCarouselPreview } from "../HeroCarouselPreviewContext"

export const useNavigation = (slideCount: number) => {
  const preview = useHeroCarouselPreview()
  const [localIndex, setLocalIndex] = useState(0)
  const [, startTransition] = useTransition()

  const rawIndex = preview ? preview.activeIndex : localIndex
  // Clamp for this render only. Arrow clicks are what write a new index.
  const currentIndex =
    slideCount === 0 ? 0 : Math.min(Math.max(rawIndex, 0), slideCount - 1)

  const navigateByDirection = useCallback(
    (direction: "prev" | "next") => {
      if (slideCount === 0) {
        return
      }

      const offset = direction === "next" ? 1 : -1
      const next = (currentIndex + offset + slideCount) % slideCount
      startTransition(() => {
        if (preview) {
          preview.setActiveIndex(next)
        } else {
          setLocalIndex(next)
        }
      })
    },
    [currentIndex, preview, slideCount, startTransition],
  )

  const onPrev = useCallback(
    () => navigateByDirection("prev"),
    [navigateByDirection],
  )
  const onNext = useCallback(
    () => navigateByDirection("next"),
    [navigateByDirection],
  )

  return {
    currentIndex,
    controlProps: {
      slideCount,
      currentIndex,
      onPrev,
      onNext,
    },
  }
}
