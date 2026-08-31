import type { ImageGalleryProps } from "~/interfaces/complex/ImageGallery"
import { isExternalUrl } from "~/utils/isExternalUrl"

import { type ContentBlockIndexProps } from "../../../render/contentBlockIndex"
import { ImageGalleryClient } from "./ImageGalleryClient"

type ImageGalleryRenderProps = ImageGalleryProps & ContentBlockIndexProps

export const ImageGallery = (props: ImageGalleryRenderProps) => {
  const { site, images, contentBlockIndex, ...rest } = props

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
      contentBlockIndex={contentBlockIndex}
      {...rest}
    />
  )
}
