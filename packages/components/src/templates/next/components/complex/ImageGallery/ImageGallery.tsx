import type { ImageGalleryProps } from "~/interfaces/complex/ImageGallery"
import { isExternalUrl } from "~/utils/isExternalUrl"

import { ImageGalleryClient } from "./ImageGalleryClient"

export const ImageGallery = (props: ImageGalleryProps) => {
  const { site, images, ...rest } = props
  if (images.length === 0) return null

  const processedImages = images.map((image) => ({
    ...image,
    src:
      isExternalUrl(image.src) || site.assetsBaseUrl === undefined
        ? image.src
        : `${site.assetsBaseUrl}${image.src}`,
  }))

  // Spacing lives here rather than on ImageGalleryClient's root: islands are wrapped in an
  // extra element, so a `first:` variant on the island root would always match.
  return (
    <div className="mt-6 w-full first:mt-0">
      <ImageGalleryClient
        assetsBaseUrl={site.assetsBaseUrl}
        images={processedImages}
        {...rest}
      />
    </div>
  )
}
