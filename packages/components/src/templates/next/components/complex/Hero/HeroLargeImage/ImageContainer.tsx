"use client"

import { useEffect, useRef, useState } from "react"

import { ImageClient } from "../../Image"
import { ScrollForMoreButton } from "./ScrollForMoreButton"

interface ImageContainerProps {
  imageSrc: string
  imageAlt: string
}

// Arbitrary threshold to prevent the button from showing too early
const SCROLL_THRESHOLD = 120

export const ImageContainer = ({ imageSrc, imageAlt }: ImageContainerProps) => {
  const imageRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isFixed, setIsFixed] = useState(true)
  const [shouldShowButton, setShouldShowButton] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      if (!imageRef.current || !containerRef.current) return

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

    window.addEventListener("scroll", handleScroll)
    window.addEventListener("resize", handleScroll)
    handleScroll()

    return () => {
      window.removeEventListener("scroll", handleScroll)
      window.removeEventListener("resize", handleScroll)
    }
  }, [])

  return (
    <div className="relative w-full" ref={containerRef}>
      <ImageClient
        ref={imageRef}
        src={imageSrc}
        alt={imageAlt}
        width="100%"
        className="aspect-square max-h-[60rem] w-full object-center md:aspect-[2/1]"
        lazyLoading={false}
      />
      {shouldShowButton && <ScrollForMoreButton isFixed={isFixed} />}
    </div>
  )
}
