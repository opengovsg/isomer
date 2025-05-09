"use client"

import { useCallback, useState } from "react"

import type { ImageGalleryClientProps } from "~/interfaces/complex/ImageGallery"
import { useBreakpoint } from "~/hooks/useBreakpoint"
import { tv } from "~/lib/tv"
import { ImageClient } from "../Image/ImageClient"
import {
  LEFT_ARROW_SVG,
  RIGHT_ARROW_SVG,
  TRANSITION_DURATION,
} from "./constants"
import { getPreviewIndices } from "./utils"

// Constant for controlling how many images are rendered at once
const VISIBLE_RANGE = 2

const createImagePreviewStyles = tv({
  slots: {
    container:
      "relative aspect-[1/1] w-full flex-1 flex-shrink-0 overflow-hidden border-[1px] focus-visible:outline focus-visible:outline-[0.75rem] focus-visible:outline-offset-[-0.75rem] focus-visible:outline-utility-highlight",
  },
  variants: {
    isSelected: {
      true: {
        container:
          "border-base-content outline outline-[0.25rem] outline-offset-[-0.25rem] outline-base-content",
      },
      false: {
        container: "border-base-divider-subtle hover:opacity-80",
      },
    },
    numberOfImages: {
      "3": {
        container: "h-[7.375rem]",
      },
      "5": {
        container: "h-[5.375rem]",
      },
    },
  },
})

const compoundStyles = createImagePreviewStyles()

export const ImageGalleryClient = ({
  images,
  assetsBaseUrl,
  shouldLazyLoad,
}: ImageGalleryClientProps) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const navigate = useCallback(
    (direction: "prev" | "next") => {
      if (isTransitioning) return

      setIsTransitioning(true)

      // Set a brief timeout to ensure transition animation works smoothly
      setTimeout(() => {
        setCurrentIndex((current) =>
          direction === "next"
            ? (current + 1) % images.length
            : (current - 1 + images.length) % images.length,
        )

        // Reset transition state after the animation completes
        setTimeout(() => {
          setIsTransitioning(false)
        }, TRANSITION_DURATION)
      }, 50)
    },
    [images.length, isTransitioning],
  )

  // Defensive programming: Guard against empty images array
  if (images.length === 0) {
    return null
  }

  const isDesktop = useBreakpoint("lg")
  const maxPreviewImages = isDesktop ? 5 : 3

  const previewIndices = getPreviewIndices({
    numberOfImages: images.length,
    currentIndex,
    maxPreviewImages,
  })

  return (
    <section
      className="mt-6 w-full first:mt-0"
      role="region"
      aria-label="Image gallery"
    >
      {/* Main Slideshow */}
      <div className="relative h-[17rem] w-full overflow-hidden border bg-white sm:h-[28.5rem]">
        {/* Container for all images */}
        <div className="relative h-full w-full">
          {images.map((image, index) => {
            const isVisible =
              index >= currentIndex - VISIBLE_RANGE &&
              index <= currentIndex + VISIBLE_RANGE

            const isCurrent = index === currentIndex

            return (
              <div
                key={index}
                className={`absolute inset-0 h-full w-full transition-opacity duration-${TRANSITION_DURATION} ease-out ${
                  isCurrent ? "z-10 opacity-100" : "z-0 opacity-0"
                }`}
                aria-hidden={!isCurrent}
              >
                {isVisible && (
                  <div className="relative h-full w-full">
                    <ImageClient
                      src={image.src}
                      alt={image.alt}
                      width="100%"
                      className="h-full w-full object-contain"
                      assetsBaseUrl={assetsBaseUrl}
                      lazyLoading={shouldLazyLoad}
                    />
                    {image.caption && (
                      <div className="prose-label-sm-medium absolute bottom-0 left-0 right-0 bg-base-canvas-inverse-overlay/90 p-3 text-white">
                        {image.caption}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Navigation Controls - Accessible via keyboard tab navigation */}
        <button
          className="absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full border-2 border-white bg-base-canvas-inverse-overlay/90 p-1 text-white hover:bg-base-canvas-inverse-overlay focus-visible:border-utility-highlight focus-visible:bg-base-canvas-inverse-overlay focus-visible:outline-none focus-visible:ring-[0.375rem] focus-visible:ring-utility-highlight"
          onClick={() => navigate("prev")}
          aria-label="Previous image"
          disabled={isTransitioning}
        >
          {LEFT_ARROW_SVG}
        </button>

        <button
          className="absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full border-2 border-white bg-base-canvas-inverse-overlay/90 p-1 text-white hover:bg-base-canvas-inverse-overlay focus-visible:border-utility-highlight focus-visible:bg-base-canvas-inverse-overlay focus-visible:outline-none focus-visible:ring-[0.375rem] focus-visible:ring-utility-highlight"
          onClick={() => navigate("next")}
          aria-label="Next image"
          disabled={isTransitioning}
        >
          {RIGHT_ARROW_SVG}
        </button>

        {/* Screen reader status */}
        <div className="sr-only" aria-live="polite">
          Image {currentIndex + 1} of {images.length}
          {images[currentIndex]?.caption
            ? `: ${images[currentIndex].caption}`
            : ""}
        </div>
      </div>

      {/* Preview Sequence - Using grid for fixed columns */}
      <div className="mt-6 hidden w-full gap-3 sm:grid md:grid-cols-3 lg:grid-cols-5">
        {previewIndices.map((index) => {
          const previewImage = images[index]
          if (!previewImage) return null

          return (
            <button
              key={index}
              className={compoundStyles.container({
                isSelected: index === currentIndex,
                numberOfImages: maxPreviewImages.toString() as "3" | "5",
              })}
              onClick={() => {
                if (!isTransitioning) {
                  setIsTransitioning(true)
                  setCurrentIndex(index)
                  setTimeout(() => {
                    setIsTransitioning(false)
                  }, TRANSITION_DURATION)
                }
              }}
              aria-label={`View image ${index + 1} of ${images.length}`}
              aria-current={index === currentIndex}
              disabled={currentIndex === index || isTransitioning}
            >
              <ImageClient
                key={previewImage.src + index} // in case of same src, use index as key
                src={previewImage.src}
                alt={previewImage.alt}
                width="100%"
                className="h-full w-full object-contain"
                assetsBaseUrl={assetsBaseUrl}
                lazyLoading={shouldLazyLoad}
              />
            </button>
          )
        })}
      </div>
    </section>
  )
}
