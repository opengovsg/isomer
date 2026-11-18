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
        // Keeps the fixed "imageAdjustment" key, not the field-named one that
        // content components use. One image means no collision.
        // resource.service.ts reads it as thumbnailAdjustment.
        imageAdjustment: Type.Optional(imageAdjustmentSchema),
      },
      {
        title: "Set a thumbnail image",
      },
    ),
  ),
})
