"use client"

import { forwardRef } from "react"

import type { ImageClientProps } from "~/interfaces"

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
      onError,
    },
    ref,
  ) => {
    return (
      <img
        ref={ref}
        src={src}
        alt={alt}
        width={width}
        height="auto"
        className={className}
        onLoad={onLoad}
        onError={(e) => {
          if (onError) {
            onError(e)
            if (e.defaultPrevented) return
          }

          const { currentTarget } = e
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
