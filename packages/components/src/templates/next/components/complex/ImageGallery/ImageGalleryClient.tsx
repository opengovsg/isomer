"use client"

import { useCallback, useState } from "react"

import type { ImageGalleryClientProps } from "~/interfaces/complex/ImageGallery"
import { ImageClient } from "../Image/ImageClient"
import { LEFT_ARROW_SVG, RIGHT_ARROW_SVG } from "./constants"
import { getPreviewIndices } from "./utils"

export const ImageGalleryClient = ({
  images,
  assetsBaseUrl,
  shouldLazyLoad,
}: ImageGalleryClientProps) => {
  const [currentIndex, setCurrentIndex] = useState(0)

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

  const currentImage = images[currentIndex]

  if (!currentImage) {
    return null
  }

  return (
    <section className="w-full" role="region" aria-label="Image gallery">
      {/* Main Slideshow */}
      <div className="relative h-[17rem] w-full border bg-white sm:h-[28.5rem]">
        <div className="relative h-full w-full">
          <div className="h-full w-full motion-safe:transition motion-safe:duration-300 motion-safe:ease-out">
            <ImageClient
              src={currentImage.src}
              alt={currentImage.alt}
              width="100%"
              className="h-full w-full object-contain"
              assetsBaseUrl={assetsBaseUrl}
              lazyLoading={shouldLazyLoad}
            />
            {currentImage.caption && (
              <div className="prose-label-sm-medium absolute bottom-0 left-0 right-0 bg-base-canvas-inverse-overlay/90 p-3 text-white">
                {currentImage.caption}
              </div>
            )}
          </div>
        </div>

        {/* Navigation Controls - Accessible via keyboard tab navigation */}
        <button
          className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-base-canvas-inverse-overlay/90 p-1 text-white hover:bg-base-canvas-inverse-overlay focus:border-utility-highlight focus:bg-base-canvas-inverse-overlay focus:outline-none focus:ring-4 focus:ring-utility-highlight"
          onClick={() => navigate("prev")}
          aria-label="Previous image"
        >
          {LEFT_ARROW_SVG}
        </button>

        <button
          className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-base-canvas-inverse-overlay/90 p-1 text-white hover:bg-base-canvas-inverse-overlay focus:border-utility-highlight focus:bg-base-canvas-inverse-overlay focus:outline-none focus:ring-4 focus:ring-utility-highlight"
          onClick={() => navigate("next")}
          aria-label="Next image"
        >
          {RIGHT_ARROW_SVG}
        </button>
      </div>

      {/* Preview Sequence - Hidden on Mobile */}
      <div className="mt-6 hidden w-full justify-center gap-3 sm:flex">
        {getPreviewIndices({
          numberOfImages: images.length,
          currentIndex,
        }).map((index) => {
          const previewImage = images[index]
          if (!previewImage) return null

          return (
            <button
              key={index}
              className={`relative h-20 w-20 flex-shrink-0 overflow-hidden border-2 ${
                index === currentIndex
                  ? "border-blue-500"
                  : "border-transparent hover:opacity-80"
              } focus:opacity-80 focus:outline-none focus:ring-2 focus:ring-blue-500`}
              onClick={() => setCurrentIndex(index)}
              aria-label={`View image ${index + 1} of ${images.length}`}
              aria-current={index === currentIndex}
              disabled={currentIndex === index}
            >
              <ImageClient
                src={previewImage.src}
                alt={previewImage.alt}
                width="100%"
                className="h-full w-full object-cover"
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
