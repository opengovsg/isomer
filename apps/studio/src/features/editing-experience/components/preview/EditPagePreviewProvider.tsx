import type { PropsWithChildren } from "react"
import { HeroCarouselPreviewProvider } from "@opengovsg/isomer-components"
import { createContext, useContext, useState } from "react"

import type { ViewportOptions } from "./IframeToolbar"

const EditPageViewportContext = createContext<{
  viewport: ViewportOptions
  setViewport: (viewport: ViewportOptions) => void
} | null>(null)

export function EditPagePreviewProvider({ children }: PropsWithChildren) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [viewport, setViewport] = useState<ViewportOptions>("responsive")

  return (
    <EditPageViewportContext.Provider value={{ viewport, setViewport }}>
      <HeroCarouselPreviewProvider
        value={{
          activeIndex,
          setActiveIndex,
          autoplay: viewport === "fullscreen",
        }}
      >
        {children}
      </HeroCarouselPreviewProvider>
    </EditPageViewportContext.Provider>
  )
}

export function useEditPageViewport() {
  const value = useContext(EditPageViewportContext)
  if (!value) {
    throw new Error(
      "useEditPageViewport must be used within an EditPagePreviewProvider",
    )
  }
  return value
}
