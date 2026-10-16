import type { Static } from "@sinclair/typebox"
import type { IsomerSiteProps } from "~/types"
import { Type } from "@sinclair/typebox"

import { IsomerString } from "../primitives/IsomerString"
import { AltTextSchema, imageAdjustmentSchema, ImageSrcSchema } from "./Image"

const SingleImageSchema = Type.Object({
  src: ImageSrcSchema,
  alt: AltTextSchema,
  caption: Type.Optional(IsomerString()),
  // Sibling written by the adjustment modal; absence = unedited. The crop is
  // baked into `src` (then letterboxed by the gallery frame), so the renderer
  // needs nothing at runtime — kept only to re-bake from the original.
  imageAdjustment: Type.Optional(imageAdjustmentSchema),
})

export const ImageGallerySchema = Type.Object(
  {
    type: Type.Literal("imagegallery", {
      default: "imagegallery",
    }),
    images: Type.Array(SingleImageSchema, {
      title: "Images",
      minItems: 2,
      maxItems: 30,
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
