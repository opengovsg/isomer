"use client"

import type { ImageClientProps } from "~/interfaces"
import { forwardRef } from "react"
import { getFocalObjectPosition } from "~/utils/getFocalObjectPosition"
import { isExternalUrl } from "~/utils/isExternalUrl"

export const ImageClient = forwardRef<
  HTMLImageElement,
  Omit<ImageClientProps, "ref">
>(
  (
    {
      src,
      alt,
      width,
      className,
      assetsBaseUrl,
      lazyLoading = true, // next/image defaults to lazy loading true too
      onLoad,
      objectPosition,
      imageAdjustment,
    },
    ref,
  ) => {
    const imgSrc =
      isExternalUrl(src) || assetsBaseUrl === undefined
        ? src
        : `${assetsBaseUrl}${src}`

    // Explicit objectPosition wins; otherwise derive focal from imageAdjustment.
    const resolvedObjectPosition =
      objectPosition ?? getFocalObjectPosition(imageAdjustment)

    return (
      <img
        ref={ref}
        src={imgSrc}
        alt={alt}
        width={width}
        height="auto"
        className={className}
        style={
          resolvedObjectPosition
            ? { objectPosition: resolvedObjectPosition }
            : undefined
        }
        onLoad={onLoad}
        onError={({ currentTarget }) => {
          currentTarget.onerror = null
          currentTarget.src = `${assetsBaseUrl ?? ""}/placeholder_no_image.png`
        }}
        loading={lazyLoading ? "lazy" : "eager"}
        fetchPriority={lazyLoading ? "auto" : "high"}
        decoding={lazyLoading ? "async" : "auto"} // sync decoding can block the main thread
      />
    )
  },
)
