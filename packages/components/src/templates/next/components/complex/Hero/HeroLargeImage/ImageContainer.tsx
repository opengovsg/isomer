"use client"

import { useCallback, useEffect, useRef, useState } from "react"

import type { ImageClientProps } from "~/interfaces"
import { ImageClient } from "../../Image"
import { ScrollForMoreButton } from "./ScrollForMoreButton"

interface ImageContainerProps {
  imageSrc: ImageClientProps["src"]
  imageAlt: ImageClientProps["alt"]
}

// Arbitrary threshold to prevent the button from showing too early
const SCROLL_THRESHOLD = 120

// Grouping scroll events to prevent excessive re-renders
const THROTTLE_DELAY = 100

export const ImageContainer = ({ imageSrc, imageAlt }: ImageContainerProps) => {
  const imageRef = useRef<HTMLImageElement>(null)
  const [isFixed, setIsFixed] = useState(false)
  const [shouldShowButton, setShouldShowButton] = useState(false)

  const handleScroll = useCallback(() => {
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
    console.log("imageBottom", imageBottom)
    setIsFixed(imageBottom > viewportHeight + 1)
  }, [])

  useEffect(() => {
    // to not render during static site generation on the server
    if (typeof window === "undefined") return

    let inThrottle = false
    const throttledScrollHandler = () => {
      if (!inThrottle) {
        handleScroll()
        inThrottle = true
        setTimeout(() => {
          inThrottle = false
        }, THROTTLE_DELAY)
      }
    }

    window.addEventListener("scroll", throttledScrollHandler)
    window.addEventListener("resize", throttledScrollHandler)
    handleScroll()

    return () => {
      window.removeEventListener("scroll", throttledScrollHandler)
      window.removeEventListener("resize", throttledScrollHandler)
    }
  }, [handleScroll])

  return (
    <div className="relative w-full">
      <ImageClient
        ref={imageRef}
        src={imageSrc}
        alt={imageAlt}
        width="100%"
        className="aspect-square max-h-[60rem] w-full object-cover object-center md:aspect-[2/1]"
        lazyLoading={false}
      />
      {shouldShowButton && <ScrollForMoreButton isFixed={isFixed} />}
    </div>
  )
}
