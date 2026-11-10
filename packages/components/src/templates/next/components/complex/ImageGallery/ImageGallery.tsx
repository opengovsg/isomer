import type { ImageGalleryProps } from "~/interfaces/complex/ImageGallery"

import { ImageGalleryClient } from "./ImageGalleryClient"

// images[].src is passed through raw (relative); ImageClient resolves it against
// assetsBaseUrl.
export const ImageGallery = (props: ImageGalleryProps) => {
  const { site, images, ...rest } = props

  return (
    <ImageGalleryClient
      assetsBaseUrl={site.assetsBaseUrl}
      images={images}
      {...rest}
    />
  )
}
