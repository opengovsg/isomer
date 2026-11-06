"use client"

import type { ImageClientWithAdjustmentProps } from "~/interfaces"
import { useEffect, useRef, useState } from "react"

import { ImageClientWithAdjustment } from "../../../internal/ImageClient"
import { ScrollForMoreButton } from "./ScrollForMoreButton"

interface ImageContainerProps {
  imageSrc: ImageClientWithAdjustmentProps["src"]
  imageAlt: ImageClientWithAdjustmentProps["alt"]
  assetsBaseUrl: ImageClientWithAdjustmentProps["assetsBaseUrl"]
  imageAdjustment?: ImageClientWithAdjustmentProps["imageAdjustment"]
}

// Arbitrary threshold to prevent the button from showing too early
const SCROLL_THRESHOLD = 120

export const ImageContainer = ({
  imageSrc,
  imageAlt,
  assetsBaseUrl,
  imageAdjustment,
}: ImageContainerProps) => {
  const imageRef = useRef<HTMLImageElement>(null)
  const [isFixed, setIsFixed] = useState(false)
  const [shouldShowButton, setShouldShowButton] = useState(false)

  const handleScroll = () => {
    if (!imageRef.current) return

    const imageRect = imageRef.current.getBoundingClientRect()

    if (imageRect.top + SCROLL_THRESHOLD >= window.innerHeight) {
      setShouldShowButton(false)
      return
    } else {
      setShouldShowButton(true)
    }

    const imageBottom = imageRect.bottom
    const viewportHeight = window.innerHeight
    setIsFixed(imageBottom > viewportHeight + 1)
  }

  useEffect(() => {
    // to not render during static site generation on the server
    if (typeof window === "undefined") return

    window.addEventListener("scroll", handleScroll, { passive: true })
    window.addEventListener("resize", handleScroll)
    handleScroll()

    return () => {
      window.removeEventListener("scroll", handleScroll)
      window.removeEventListener("resize", handleScroll)
    }
  }, [])

  return (
    <div className="relative w-full">
      <ImageClientWithAdjustment
        ref={imageRef}
        src={imageSrc}
        alt={imageAlt}
        width="100%"
        className="aspect-square max-h-[60rem] w-full object-cover object-center md:aspect-[2/1]"
        imageAdjustment={imageAdjustment}
        assetsBaseUrl={assetsBaseUrl}
        lazyLoading={false} // hero is always above the fold
      />
      {shouldShowButton && <ScrollForMoreButton isFixed={isFixed} />}
    </div>
  )
}
