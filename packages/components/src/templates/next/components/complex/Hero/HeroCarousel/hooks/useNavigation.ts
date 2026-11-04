import { useCallback, useState, useTransition } from "react"

import { useHeroCarouselPreview } from "../HeroCarouselPreviewContext"

export const useNavigation = (slideCount: number) => {
  const preview = useHeroCarouselPreview()
  const [localIndex, setLocalIndex] = useState(0)
  const [, startTransition] = useTransition()

  const rawIndex = preview ? preview.activeIndex : localIndex
  // Clamp for this render. Buttons and swipes set the index.
  const currentIndex =
    slideCount === 0 ? 0 : Math.min(Math.max(rawIndex, 0), slideCount - 1)

  const onGoTo = useCallback(
    (index: number) => {
      if (slideCount === 0) {
        return
      }

      const next = Math.min(Math.max(index, 0), slideCount - 1)
      startTransition(() => {
        if (preview) {
          preview.setActiveIndex(next)
        } else {
          setLocalIndex(next)
        }
      })
    },
    [preview, slideCount, startTransition],
  )

  return { currentIndex, onGoTo }
}
