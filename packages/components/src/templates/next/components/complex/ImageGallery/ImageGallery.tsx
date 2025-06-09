import type { ImageGalleryProps } from "~/interfaces/complex/ImageGallery"
import { isExternalUrl } from "~/utils/isExternalUrl"
import { ImageGalleryClient } from "./ImageGalleryClient"

export const ImageGallery = (props: ImageGalleryProps) => {
  const { site, images, ...rest } = props

  const processedImages = images.map((image) => ({
    ...image,
    src:
      isExternalUrl(image.src) || site.assetsBaseUrl === undefined
        ? image.src
        : `${site.assetsBaseUrl}${image.src}`,
  }))

  return (
    <ImageGalleryClient
      assetsBaseUrl={site.assetsBaseUrl}
      images={processedImages}
      {...rest}
    />
  )
}
