import type { ImageGalleryProps } from "~/interfaces/complex/ImageGallery"
import { omit } from "lodash-es"

import { ImageGalleryClient } from "./ImageGalleryClient"

// images[].src is passed through raw (relative); ImageClient resolves it against
// assetsBaseUrl.
export const ImageGallery = (props: ImageGalleryProps) => {
  const { site, images, ...rest } = props
  // The client never reads the adjustment, since the crop is baked into
  // `src`. Sending it would put `originalKey` in the page HTML.
  const clientImages = images.map((image) => omit(image, "srcImageAdjustment"))

  return (
    <ImageGalleryClient
      assetsBaseUrl={site.assetsBaseUrl}
      images={clientImages}
      {...rest}
    />
  )
}
