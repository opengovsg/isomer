"use client"

import type { ReactNode } from "react"
import { createContext, useContext } from "react"

export interface HeroCarouselPreview {
  activeIndex: number
  setActiveIndex: (index: number) => void
  autoplay: boolean
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
