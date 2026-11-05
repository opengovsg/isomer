"use client"

import type { ReactNode } from "react"
import { createContext, useContext } from "react"

export interface HeroCarouselPreview {
  activeIndex: number
  setActiveIndex: (index: number) => void
  autoplay: boolean
  // Studio sets this so a play/pause click can point at the preview notice
  // while autoplay is held off.
  onAutoplayBlocked?: () => void
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
