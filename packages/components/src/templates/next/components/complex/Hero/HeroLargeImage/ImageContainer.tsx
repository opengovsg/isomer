"use client"

import type { ImageClientProps } from "~/interfaces"
import type { HeroLargeImageProps } from "~/interfaces/complex/Hero"
import { useEffect, useRef, useState } from "react"
import { IMAGE_FIT } from "~/interfaces/constants"

import { ImageClient } from "../../../internal/ImageClient"
import { ScrollForMoreButton } from "./ScrollForMoreButton"

interface ImageContainerProps {
  imageSrc: ImageClientProps["src"]
  imageAlt: ImageClientProps["alt"]
  imageFit?: HeroLargeImageProps["imageFit"]
  assetsBaseUrl: ImageClientProps["assetsBaseUrl"]
}

// Arbitrary threshold to prevent the button from showing too early
const SCROLL_THRESHOLD = 120

export const ImageContainer = ({
  imageSrc,
  imageAlt,
  imageFit = IMAGE_FIT.Cover,
  assetsBaseUrl,
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
      <ImageClient
        ref={imageRef}
        src={imageSrc}
        alt={imageAlt}
        width="100%"
        className={
          imageFit === IMAGE_FIT.Content
            ? "mx-auto block h-auto max-h-[31.25rem] w-auto max-w-full"
            : "aspect-square max-h-[60rem] w-full object-cover object-center md:aspect-[2/1]"
        }
        assetsBaseUrl={assetsBaseUrl}
        lazyLoading={false} // hero is always above the fold
      />
      {shouldShowButton && <ScrollForMoreButton isFixed={isFixed} />}
    </div>
  )
}
