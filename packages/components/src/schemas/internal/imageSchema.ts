import { Type } from "@sinclair/typebox"
import {
  generateImageSrcSchema,
  AltTextSchema,
  imageAdjustmentSchema,
} from "~/interfaces/complex/Image"

import { CollectionThumbnailImageFitSchema } from "./imageFitSchema"

// NOTE: This is only for thumbnail images in various places, a refactor would
// be required if this is used in other places
export const imageSchemaObject = Type.Object({
  image: Type.Optional(
    Type.Object(
      {
        src: generateImageSrcSchema({
          title: "Thumbnail",
          description:
            "Upload an image if you want to have a custom thumbnail for this item",
        }),
        alt: AltTextSchema,
        imageFit: Type.Optional(CollectionThumbnailImageFitSchema),
        // Sibling written by the adjustment modal; absence = unedited. Crop is
        // baked into `src`; focal renders as object-position only under
        // imageFit "cover" (contain letterboxes the whole image) — see
        // CollectionCard/BlogCard.
        imageAdjustment: Type.Optional(imageAdjustmentSchema),
      },
      {
        title: "Set a thumbnail image",
      },
    ),
  ),
})
