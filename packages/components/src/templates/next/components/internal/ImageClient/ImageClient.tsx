import type { ImageClientProps } from "~/interfaces"
import { forwardRef } from "react"
import { island } from "~/islands/island"
import { isExternalUrl } from "~/utils/isExternalUrl"

const ImageClientComponent = forwardRef<
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

export const ImageClient = island("ImageClient", ImageClientComponent, {
  hydrate: "load",
})
