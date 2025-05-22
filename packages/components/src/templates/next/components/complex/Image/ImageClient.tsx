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
        onError={({ currentTarget }) => {
          currentTarget.onerror = null
          currentTarget.src = `${assetsBaseUrl ?? ""}/placeholder_no_image.png`
        }}
        loading={lazyLoading ? "lazy" : "eager"}
      />
    )
  },
)
