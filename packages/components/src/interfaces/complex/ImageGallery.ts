import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type { IsomerSiteProps } from "~/types"
import { AltTextSchema, ImageSrcSchema } from "./Image"

export const IMAGE_GALLERY_TYPE = "imagegallery"

const SingleImageSchema = Type.Object({
  src: ImageSrcSchema,
  alt: AltTextSchema,
  caption: Type.Optional(Type.String({ maxLength: 250 })),
})

export const ImageGallerySchema = Type.Object(
  {
    type: Type.Literal(IMAGE_GALLERY_TYPE, { default: IMAGE_GALLERY_TYPE }),
    images: Type.Array(SingleImageSchema, {
      title: "Images",
      minItems: 2,
      maxItems: 30,
    }),
  },
  {
    title: "Image Gallery component",
  },
)

export type ImageGalleryProps = Static<typeof ImageGallerySchema> & {
  site: IsomerSiteProps
  shouldLazyLoad?: boolean
}

export type ImageGalleryClientProps = Omit<ImageGalleryProps, "site"> & {
  assetsBaseUrl: IsomerSiteProps["assetsBaseUrl"]
}
