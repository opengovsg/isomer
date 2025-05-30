import type { ImageGalleryProps } from "~/interfaces/complex/ImageGallery"
import { ImageGalleryClient } from "./ImageGalleryClient"

export const ImageGallery = (props: ImageGalleryProps) => {
  const { site, ...rest } = props
  return <ImageGalleryClient assetsBaseUrl={site.assetsBaseUrl} {...rest} />
}
