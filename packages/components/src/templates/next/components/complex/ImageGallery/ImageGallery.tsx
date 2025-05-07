"use client"

import { useCallback, useState } from "react"

import type { ImageGalleryProps } from "~/interfaces/complex/ImageGallery"
import { ImageClient } from "../../complex/Image/ImageClient"
import {
  LEFT_ARROW_SVG,
  MAXIMUM_NUMBER_OF_IMAGES_IN_PREVIEW,
  RIGHT_ARROW_SVG,
} from "./constants"

export const ImageGallery = ({
  images,
  site,
  shouldLazyLoad,
}: ImageGalleryProps) => {
  const [currentIndex, setCurrentIndex] = useState(0)

  // Calculate which images should be shown in preview
  const getPreviewIndices = () => {
    // If there are less than or equal to 5 images, show all of them
    if (images.length <= MAXIMUM_NUMBER_OF_IMAGES_IN_PREVIEW) {
      return Array.from({ length: images.length }, (_, i) => i)
    }

    const numberOfImagesBeforeCurrent = 2

    // Calculate the center position for the current image in preview
    const idealStart = Math.max(0, currentIndex - numberOfImagesBeforeCurrent)

    // Ensure we don't go past the end when displaying the maximum number of previews
    const maxStartPosition = images.length - MAXIMUM_NUMBER_OF_IMAGES_IN_PREVIEW

    // Get the final starting position
    const start = Math.min(idealStart, maxStartPosition)

    // Create and return the array of indices
    return Array.from(
      { length: MAXIMUM_NUMBER_OF_IMAGES_IN_PREVIEW },
      (_, i) => start + i,
    )
  }

  const navigate = useCallback(
    (direction: "prev" | "next") => {
      setCurrentIndex((current) =>
        direction === "next"
          ? (current + 1) % images.length
          : (current - 1 + images.length) % images.length,
      )
    },
    [images.length],
  )

  // Defensive programming: Guard against empty images array
  if (images.length === 0) {
    return null
  }

  // Ensure currentIndex is within bounds
  const safeCurrentIndex = Math.min(currentIndex, images.length - 1)
  const currentImage = images[safeCurrentIndex]

  if (!currentImage) {
    return null
  }

  return (
    <section className="w-full" role="region" aria-label="Image gallery">
      {/* Main Slideshow */}
      <div className="relative h-[17rem] w-full border border-gray-100 bg-white sm:h-[28.5rem]">
        <div className="relative h-full w-full">
          <div className="h-full w-full motion-safe:transition motion-safe:duration-300 motion-safe:ease-out">
            <ImageClient
              src={currentImage.src}
              alt={currentImage.alt}
              width="100%"
              className="h-full w-full object-contain"
              assetsBaseUrl={site.assetsBaseUrl}
              lazyLoading={shouldLazyLoad}
            />

            {currentImage.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/90 p-4 text-white">
                <p>{currentImage.caption}</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Controls - Accessible via keyboard tab navigation */}
        <button
          className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-black/50 p-2 text-white hover:bg-black/70 focus:bg-black/70 focus:outline-none focus:ring-2 focus:ring-white"
          onClick={() => navigate("prev")}
          aria-label="Previous image"
        >
          {LEFT_ARROW_SVG}
        </button>

        <button
          className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-black/50 p-2 text-white hover:bg-black/70 focus:bg-black/70 focus:outline-none focus:ring-2 focus:ring-white"
          onClick={() => navigate("next")}
          aria-label="Next image"
        >
          {RIGHT_ARROW_SVG}
        </button>
      </div>

      {/* Preview Sequence - Hidden on Mobile */}
      <div className="mt-4 hidden w-full justify-center gap-2 sm:flex">
        {getPreviewIndices().map((index) => {
          const previewImage = images[index]
          if (!previewImage) return null

          return (
            <button
              key={index}
              className={`relative h-20 w-20 flex-shrink-0 overflow-hidden border-2 hover:opacity-80 focus:opacity-80 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                index === safeCurrentIndex
                  ? "border-blue-500"
                  : "border-transparent"
              }`}
              onClick={() => setCurrentIndex(index)}
              aria-label={`View image ${index + 1} of ${images.length}`}
              aria-current={index === safeCurrentIndex}
            >
              <ImageClient
                src={previewImage.src}
                alt=""
                width="100%"
                className="h-full w-full object-cover"
                assetsBaseUrl={site.assetsBaseUrl}
                lazyLoading={shouldLazyLoad}
              />
            </button>
          )
        })}
      </div>
    </section>
  )
}
