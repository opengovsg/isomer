import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type { IsomerSiteProps } from "~/types"
import { COMPONENT_TYPES_MAP } from "~/constants"
import { AltTextSchema, ImageSrcSchema } from "./Image"

const SingleImageSchema = Type.Object({
  src: ImageSrcSchema,
  alt: AltTextSchema,
  caption: Type.Optional(Type.String()),
})

export const ImageGallerySchema = Type.Object(
  {
    type: Type.Literal(COMPONENT_TYPES_MAP.ImageGallery, {
      default: COMPONENT_TYPES_MAP.ImageGallery,
    }),
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
