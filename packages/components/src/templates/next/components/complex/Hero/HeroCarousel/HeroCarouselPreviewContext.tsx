"use client"

import type { ReactNode } from "react"
import { createContext, useContext } from "react"

export interface HeroCarouselPreview {
  activeIndex: number
  setActiveIndex: (index: number) => void
  // Studio fullscreen sets this true. Omitted keeps the editor preview still.
  // A page with no provider is the published carousel, and that one rotates.
  autoplay?: boolean
}

const HeroCarouselPreviewContext = createContext<HeroCarouselPreview | null>(
  null,
)

export const HeroCarouselPreviewProvider = ({
  children,
  value,
}: {
  children: ReactNode
  value: HeroCarouselPreview
}) => (
  <HeroCarouselPreviewContext.Provider value={value}>
    {children}
  </HeroCarouselPreviewContext.Provider>
)

export const useHeroCarouselPreview = () =>
  useContext(HeroCarouselPreviewContext)
