"use client"

import type { ImageClientProps } from "~/interfaces"
import { forwardRef } from "react"
import { useOriginalAsset } from "~/templates/next/context/OriginalAssetContext"
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
    },
    ref,
  ) => {
    // Editor preview only (see OriginalAssetContext): bypass the CDN transcode
    // so a just-saved image resolves immediately instead of 404ing until it
    // propagates. Off by default, so the published site is unchanged.
    const useOriginal = useOriginalAsset()
    const imgSrc =
      isExternalUrl(src) || assetsBaseUrl === undefined
        ? src
        : `${assetsBaseUrl}${src}${useOriginal ? "?original=true" : ""}`

    return (
      <img
        ref={ref}
        src={imgSrc}
        alt={alt}
        width={width}
        height="auto"
        className={className}
        style={objectPosition ? { objectPosition } : undefined}
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
