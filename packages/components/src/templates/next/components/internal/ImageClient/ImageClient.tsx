"use client"

import { forwardRef } from "react"

import type { ImageClientProps } from "~/interfaces"
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
    },
    ref,
  ) => {
    const imgSrc =
      isExternalUrl(src) || assetsBaseUrl === undefined
        ? src
        : `${assetsBaseUrl}${src}`

    return (
      <img
        ref={ref}
        src={imgSrc}
        alt={alt}
        width={width}
        height="auto"
        className={className}
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
