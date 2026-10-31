import type { PropsWithChildren } from "react"
import { createContext, useContext, useMemo, useState } from "react"

import { useViewport } from "./ViewportProvider"

interface EditPageCarouselPreview {
  activeIndex: number
  setActiveIndex: (index: number) => void
  autoplay: boolean
}

const EditPageCarouselPreviewContext =
  createContext<EditPageCarouselPreview | null>(null)

export function EditPageCarouselPreviewProvider({
  children,
}: PropsWithChildren) {
  const { viewport } = useViewport()
  const [activeIndex, setActiveIndex] = useState(0)
  const value = useMemo(
    () => ({
      activeIndex,
      setActiveIndex,
      autoplay: viewport === "fullscreen",
    }),
    [activeIndex, viewport],
  )

  return (
    <EditPageCarouselPreviewContext.Provider value={value}>
      {children}
    </EditPageCarouselPreviewContext.Provider>
  )
}

export function useEditPageCarouselPreview() {
  return useContext(EditPageCarouselPreviewContext)
}
