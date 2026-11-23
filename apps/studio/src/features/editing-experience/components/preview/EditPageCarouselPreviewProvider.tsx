import type { PropsWithChildren } from "react"
import { createContext, useContext, useMemo, useState } from "react"
import { useCounter } from "usehooks-ts"

import { useViewport } from "./ViewportProvider"

interface EditPageCarouselPreview {
  activeIndex: number
  setActiveIndex: (index: number) => void
  autoplay: boolean
  onAutoplayBlocked: () => void
  attentionPulse: number
}

const EditPageCarouselPreviewContext =
  createContext<EditPageCarouselPreview | null>(null)

export function EditPageCarouselPreviewProvider({
  children,
}: PropsWithChildren) {
  const { viewport } = useViewport()
  const [activeIndex, setActiveIndex] = useState(0)
  const { count: attentionPulse, increment: onAutoplayBlocked } = useCounter(0)
  const value = useMemo(
    () => ({
      activeIndex,
      setActiveIndex,
      autoplay: viewport === "fullscreen",
      onAutoplayBlocked,
      attentionPulse,
    }),
    [activeIndex, attentionPulse, onAutoplayBlocked, viewport],
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
