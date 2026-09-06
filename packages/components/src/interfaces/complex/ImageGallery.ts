import type { Static } from "@sinclair/typebox"
import type { IsomerSiteProps } from "~/types"
import { Type } from "@sinclair/typebox"

import { AltTextSchema, ImageSrcSchema } from "./Image"

const SingleImageSchema = Type.Object({
  alt: AltTextSchema,
  caption: Type.Optional(Type.String()),
  src: ImageSrcSchema,
})

export const ImageGallerySchema = Type.Object(
  {
    images: Type.Array(SingleImageSchema, {
      maxItems: 30,
      minItems: 2,
      title: "Images",
    }),
    type: Type.Literal("imagegallery", {
      default: "imagegallery",
    }),
  },
  {
    title: "Image gallery",
  },
)

export type ImageGalleryProps = Static<typeof ImageGallerySchema> & {
  site: IsomerSiteProps
  shouldLazyLoad?: boolean
}

export type ImageGalleryClientProps = Omit<ImageGalleryProps, "site"> & {
  assetsBaseUrl: IsomerSiteProps["assetsBaseUrl"]
}
