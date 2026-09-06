"use client"

import type { ImageClientProps } from "~/interfaces"
import { forwardRef } from "react"
import { isExternalUrl } from "~/utils/isExternalUrl"

export const ImageClient = forwardRef<
  HTMLImageElement,
  Omit<ImageClientProps, "ref">
>(function ImageClient(
  {
    src,
    alt,
    width,
    className,
    assetsBaseUrl,
    lazyLoading = true,
    onLoad,
  },
  ref,
) {
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
          currentTarget.src = `${assetsBaseUrl ?? ""}/placeholder_no_image.png`
        }}
        loading={lazyLoading ? "lazy" : "eager"}
        fetchPriority={lazyLoading ? "auto" : "high"}
        // sync decoding can block the main thread
        decoding={lazyLoading ? "async" : "auto"}
      />
    )
  },
)
ImageClient.displayName = "ImageClient"
