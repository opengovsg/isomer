"use client"

import { useCallback, useMemo, useRef, useState, useTransition } from "react"

import type { ImageGalleryClientProps } from "~/interfaces/complex/ImageGallery"
import { useBreakpoint } from "~/hooks/useBreakpoint"
import { tv } from "~/lib/tv"
import { ImageClient } from "../Image"
import { LEFT_ARROW_SVG, RIGHT_ARROW_SVG } from "./assets"
import { getEndingPreviewIndices, getPreviewIndices } from "./utils"

const createImagePreviewStyles = tv({
  slots: {
    container:
      // Height is responsive via CSS to avoid hydration mismatch:
      // sm/md screens show 3 previews (taller), lg screens show 5 previews (shorter)
      "relative aspect-[1/1] w-full flex-1 flex-shrink-0 overflow-hidden border-[1px] focus-visible:outline focus-visible:outline-[0.75rem] focus-visible:outline-offset-[-0.75rem] focus-visible:outline-utility-highlight sm:h-[7.375rem] lg:h-[5.375rem]",
  },
  variants: {
    isSelected: {
      true: {
        container:
          "border-base-content outline outline-[0.25rem] outline-offset-[-0.25rem] outline-base-content",
      },
      false: {
        container: "border-base-divider-medium hover:opacity-80",
      },
    },
    visibility: {
      // Visible at all breakpoints (sm/md and lg)
      all: {
        container: "block",
      },
      // Only visible on lg (5 previews), hidden on sm/md (3 previews)
      lgOnly: {
        container: "hidden lg:block",
      },
      // Not visible at any breakpoint
      none: {
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
  const [isPending, startTransition] = useTransition()

  const isDesktop = useBreakpoint("lg")
  const maxPreviewImages = useMemo(() => (isDesktop ? 5 : 3), [isDesktop])

  const containerRef = useRef<HTMLDivElement>(null)

  const previewIndices = getPreviewIndices({
    numberOfImages: images.length,
    currentIndex,
    maxPreviewImages,
  })

  // In production static export, useMediaQuery causes a hydration mismatch that React
  // silently swallows — the DOM keeps the server-rendered state (3 previews) and never
  // updates until a user interaction forces a re-render. To ensure the initial HTML is
  // correct for all screen sizes, we compute preview indices for both breakpoints and
  // use CSS responsive classes to show/hide the extras (see `visibility` TV variant).
  const previewIndicesForSmMd = getPreviewIndices({
    numberOfImages: images.length,
    currentIndex,
    maxPreviewImages: 3,
  })
  const previewIndicesForLg = getPreviewIndices({
    numberOfImages: images.length,
    currentIndex,
    maxPreviewImages: 5,
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
      startTransition(() => {
        setCurrentIndex((current) =>
          direction === "next"
            ? (current + 1) % images.length
            : (current - 1 + images.length) % images.length,
        )
      })

      if (direction === "next") {
        preloadNextImage(2) // the new currentIndex + 1
      }
    },
    [images.length, preloadNextImage, startTransition],
  )

  const navigateToImageByIndex = (index: number) => {
    startTransition(() => {
      setCurrentIndex(index)
    })
  }

  const handlePreviewButtonEngagement = () => {
    // By design, all preview images have been loaded
    // Except when we are on the first image and the last few images have not been loaded yet
    if (currentIndex !== 0) return

    // In which case we need to preload the last few images in the preview sequence
    getEndingPreviewIndices({
      numberOfImages: images.length,
      maxPreviewImages,
    }).map((index: number) => preloadImage(index))
  }

  const handlePreviewImageEngagement = (index: number) => {
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
                  className={`absolute inset-0 h-full w-full transition-opacity duration-150 ease-out motion-reduce:transition-none ${
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
                        // Only the current image should respect the shouldLazyLoad prop.
                        // Non-current images are hidden (opacity-0) and should always lazy load
                        // to avoid eagerly fetching images that aren't visible on page load.
                        // They will be force-loaded on demand via preloadImage() when needed.
                        isCurrentImage ? shouldLazyLoad : true
                      }
                    />
                    {image.caption && (
                      <div className="prose-label-sm-medium absolute bottom-0 left-0 right-0 bg-base-canvas-inverse-overlay/90 p-3 text-white">
                        <div className="line-clamp-3">{image.caption}</div>
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
          aria-label="Previous image"
          disabled={isPending}
          onMouseEnter={() => handlePreviewButtonEngagement()}
          onTouchStart={() => handlePreviewButtonEngagement()}
          onFocus={() => handlePreviewButtonEngagement()}
          onClick={() => navigateToImageByDirection("prev")}
        >
          {LEFT_ARROW_SVG}
        </button>

        <button
          className="absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full border-2 border-white bg-base-canvas-inverse-overlay/90 p-1 text-white hover:bg-base-canvas-inverse-overlay focus-visible:border-utility-highlight focus-visible:bg-base-canvas-inverse-overlay focus-visible:outline-none focus-visible:ring-[0.375rem] focus-visible:ring-utility-highlight"
          aria-label="Next image"
          disabled={isPending}
          onTouchStart={() => preloadNextImage()}
          onMouseEnter={() => preloadNextImage()}
          onFocus={() => preloadNextImage()}
          onClick={() => navigateToImageByDirection("next")}
        >
          {RIGHT_ARROW_SVG}
        </button>
      </div>

      {/* Preview Sequence - Using grid for fixed columns */}
      <div
        ref={containerRef}
        className="mt-6 hidden w-full gap-3 sm:grid sm:grid-cols-3 lg:grid-cols-5"
      >
        {images.map((image, index) => {
          // We render all images, but hide the ones that are not in the preview sequence
          // This is to avoid reloading images that have been loaded (e.g. when navigating back to an already loaded image)
          // Given that current total image count is capped at 30, this has minimal performance impact (as they are basic DOM elements)
          // Visibility is CSS-driven to avoid hydration layout shift (see comment above).
          // sm/md shows 3 previews, lg shows 5 — items only in the lg set are hidden on smaller screens.
          const visibility = previewIndicesForSmMd.includes(index)
            ? "all"
            : previewIndicesForLg.includes(index)
              ? "lgOnly"
              : "none"

          return (
            <button
              key={image.src + index} // in case of same src, use index as key
              className={compoundStyles.container({
                isSelected: index === currentIndex,
                visibility,
              })}
              onClick={() => navigateToImageByIndex(index)}
              aria-label={`View image ${index + 1} of ${images.length}`}
              aria-current={index === currentIndex}
              disabled={currentIndex === index || isPending}
              onMouseEnter={() => handlePreviewImageEngagement(index)}
              onTouchStart={() => handlePreviewImageEngagement(index)}
              onFocus={() => handlePreviewImageEngagement(index)}
            >
              <ImageClient
                src={image.src}
                alt={image.alt}
                width="100%"
                className="h-full w-full object-contain"
                assetsBaseUrl={assetsBaseUrl}
                lazyLoading={
                  // Hidden images should always be lazy loaded to avoid
                  // fetching all images eagerly on page load
                  visibility === "none" ? true : shouldLazyLoad
                }
              />
            </button>
          )
        })}
      </div>
    </section>
  )
}
