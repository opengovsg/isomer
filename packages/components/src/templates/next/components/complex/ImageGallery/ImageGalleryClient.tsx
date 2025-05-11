"use client"

import { useCallback, useMemo, useRef, useState } from "react"

import type { ImageGalleryClientProps } from "~/interfaces/complex/ImageGallery"
import { useBreakpoint } from "~/hooks/useBreakpoint"
import { tv } from "~/lib/tv"
import { ImageClient } from "../Image/ImageClient"
import {
  LEFT_ARROW_SVG,
  RIGHT_ARROW_SVG,
  TRANSITION_DURATION,
} from "./constants"
import { getEndingPreviewIndices, getPreviewIndices } from "./utils"

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
    isVisible: {
      true: {
        container: "block",
      },
      false: {
        container: "hidden",
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

  const isDesktop = useBreakpoint("lg")
  const maxPreviewImages = useMemo(() => (isDesktop ? 5 : 3), [isDesktop])

  const containerRef = useRef<HTMLDivElement>(null)

  const previewIndices = getPreviewIndices({
    numberOfImages: images.length,
    currentIndex,
    maxPreviewImages,
  })

  const preloadImage = useCallback(
    (index: number) => {
      // Out of bounds
      if (index < 0 || index >= images.length) return

      // If the image is the current image, we don't need to preload it
      if (index === currentIndex) return

      const image = containerRef.current?.querySelectorAll("img")[index]
      if (!image) return // should never happen since we render all images

      // Image has already been loaded
      if (image.complete) return

      // Image not loaded yet, force load it!
      if (image.getAttribute("loading") === "lazy") {
        image.removeAttribute("loading")
        const src = image.src
        image.src = ""
        image.src = src
      }
    },
    [images, currentIndex],
  )

  const preloadNextImage = useCallback(
    (numberOfImagesAheadOfCurrentPreview = 1) => {
      const lastIndexInPreview = previewIndices[previewIndices.length - 1]
      if (!lastIndexInPreview) return // should never happen since there's always at least one image in the preview sequence
      preloadImage(lastIndexInPreview + numberOfImagesAheadOfCurrentPreview)
    },
    [preloadImage, previewIndices],
  )

  const navigateToImageByDirection = useCallback(
    (direction: "prev" | "next") => {
      if (isTransitioning) return
      setIsTransitioning(true)
      setCurrentIndex((current) =>
        direction === "next"
          ? (current + 1) % images.length
          : (current - 1 + images.length) % images.length,
      )
      setTimeout(() => setIsTransitioning(false), TRANSITION_DURATION)

      if (direction === "next") {
        preloadNextImage(2) // the new currentIndex + 1
      }
    },
    [images.length, isTransitioning, preloadNextImage],
  )

  const navigateToImageByIndex = (index: number) => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setCurrentIndex(index)
    setTimeout(() => setIsTransitioning(false), TRANSITION_DURATION)
  }

  // Defensive programming: Guard against empty images array
  if (images.length === 0) {
    return null
  }

  return (
    <section
      className="mt-6 w-full first:mt-0"
      role="region"
      aria-label="Image gallery"
    >
      {/* Main Slideshow */}
      <div className="relative h-[17rem] w-full overflow-hidden border bg-white sm:h-[28.5rem]">
        <div className="relative h-full w-full">
          {images.map((image, index) => {
            const isCurrentImage = index === currentIndex

            // Ensure all images that can be navigated to are rendered to ensure smooth transitions
            const shouldPreload =
              // Preload the image if it is in the preview thumbnail sequence
              previewIndices.includes(index) ||
              // Preload the last image if currently displaying the first image
              // to ensure smooth transitioning when navigating to the last image from the first
              (currentIndex === 0 && index === images.length - 1) ||
              // Preload the first image if currently displaying the last image
              // to ensure smooth transitioning when navigating to the first image from the last
              (currentIndex === images.length - 1 && index === 0)

            return (
              shouldPreload && (
                <div
                  key={image.src + index} // in case of same src, use index as key
                  className={`absolute inset-0 h-full w-full transition-opacity duration-${TRANSITION_DURATION} ease-out ${
                    // z-index ensures the current image always appears on top,
                    // preventing visual glitches when images overlap during transitions or when rapidly changing slides.
                    isCurrentImage ? "z-10 opacity-100" : "z-0 opacity-0"
                  }`}
                  aria-hidden={!isCurrentImage}
                >
                  <div className="relative h-full w-full">
                    <ImageClient
                      src={image.src}
                      alt={image.alt}
                      width="100%"
                      className="h-full w-full object-contain"
                      assetsBaseUrl={assetsBaseUrl}
                      lazyLoading={
                        shouldLazyLoad &&
                        // only the current image is visible and should be lazy loaded (if lazy loading is enabled)
                        // the other images aren't visible so they can be lazily loaded to not fight for loading priority
                        isCurrentImage
                      }
                    />
                    {image.caption && (
                      <div className="prose-label-sm-medium absolute bottom-0 left-0 right-0 bg-base-canvas-inverse-overlay/90 p-3 text-white">
                        {image.caption}
                      </div>
                    )}
                  </div>
                </div>
              )
            )
          })}
        </div>

        {/* Navigation Controls - Accessible via keyboard tab navigation */}
        <button
          className="absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full border-2 border-white bg-base-canvas-inverse-overlay/90 p-1 text-white hover:bg-base-canvas-inverse-overlay focus-visible:border-utility-highlight focus-visible:bg-base-canvas-inverse-overlay focus-visible:outline-none focus-visible:ring-[0.375rem] focus-visible:ring-utility-highlight"
          onClick={() => navigateToImageByDirection("prev")}
          aria-label="Previous image"
          disabled={isTransitioning}
          onMouseEnter={() => {
            // By design, all preview images have been loaded
            // Except when we are on the first image and the last few images have not been loaded yet
            if (currentIndex !== 0) return

            // In which case we need to preload the last few images in the preview sequence
            void Promise.all(
              getEndingPreviewIndices({
                numberOfImages: images.length,
                maxPreviewImages,
              }).map((index: number) => preloadImage(index)),
            )
          }}
        >
          {LEFT_ARROW_SVG}
        </button>

        <button
          className="absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full border-2 border-white bg-base-canvas-inverse-overlay/90 p-1 text-white hover:bg-base-canvas-inverse-overlay focus-visible:border-utility-highlight focus-visible:bg-base-canvas-inverse-overlay focus-visible:outline-none focus-visible:ring-[0.375rem] focus-visible:ring-utility-highlight"
          onTouchStart={() => preloadNextImage()}
          onMouseEnter={() => preloadNextImage()}
          onClick={() => navigateToImageByDirection("next")}
          aria-label="Next image"
          disabled={isTransitioning}
        >
          {RIGHT_ARROW_SVG}
        </button>
      </div>

      {/* Preview Sequence - Using grid for fixed columns */}
      <div
        ref={containerRef}
        className="mt-6 hidden w-full gap-3 sm:grid md:grid-cols-3 lg:grid-cols-5"
      >
        {images.map((image, index) => {
          // We render all images, but hide the ones that are not in the preview sequence
          // This is avoid reloading images that have been loaded (e.g. when navigating back to an already loaded image)
          // Given that current total image count is capped at 30, this have minimal performance impact (as they are basic DOM elements)
          const isVisible = previewIndices.includes(index)
          return (
            <button
              key={image.src + index} // in case of same src, use index as key
              className={compoundStyles.container({
                isSelected: index === currentIndex,
                numberOfImages: maxPreviewImages.toString() as "3" | "5",
                isVisible,
              })}
              onClick={() => navigateToImageByIndex(index)}
              aria-label={`View image ${index + 1} of ${images.length}`}
              aria-current={index === currentIndex}
              disabled={currentIndex === index || isTransitioning}
              onMouseEnter={() => {
                if (index === currentIndex) return

                switch (maxPreviewImages) {
                  case 3: // At most 1 non-preloaded image can be loaded
                    preloadImage(index + 1)
                    break
                  case 5: // At most 2 non-preloaded images can be loaded
                    preloadImage(index + 1)
                    preloadImage(index + 2)
                    break
                  default:
                    const _exhaustiveCheck: never = maxPreviewImages
                    return _exhaustiveCheck
                }
              }}
            >
              <ImageClient
                src={image.src}
                alt={image.alt}
                width="100%"
                className="h-full w-full object-contain"
                assetsBaseUrl={assetsBaseUrl}
                lazyLoading={
                  shouldLazyLoad &&
                  // only the images in preview sequence are visible and should be lazy loaded (if lazy loading is enabled)
                  // the other images aren't visible so they can be lazily loaded to not fight for loading priority
                  isVisible
                }
              />
            </button>
          )
        })}
      </div>
    </section>
  )
}
