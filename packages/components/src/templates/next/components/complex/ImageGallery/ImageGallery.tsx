import type { ImageGalleryProps } from "~/interfaces/complex/ImageGallery"

import { ImageGalleryClient } from "./ImageGalleryClient"

// images[].src is passed through raw (relative); ImageClient resolves it against
// assetsBaseUrl so the editor's ?original transcode-bypass applies.
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
