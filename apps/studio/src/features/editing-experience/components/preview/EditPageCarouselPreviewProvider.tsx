import type { PropsWithChildren } from "react"
import { HeroCarouselPreviewProvider } from "@opengovsg/isomer-components"
import { useState } from "react"

import { useViewport } from "./ViewportProvider"

export function EditPageCarouselPreviewProvider({
  children,
}: PropsWithChildren) {
  const { viewport } = useViewport()
  const [activeIndex, setActiveIndex] = useState(0)

  return (
    <HeroCarouselPreviewProvider
      value={{
        activeIndex,
        setActiveIndex,
        autoplay: viewport === "fullscreen",
      }}
    >
      {children}
    </HeroCarouselPreviewProvider>
  )
}
