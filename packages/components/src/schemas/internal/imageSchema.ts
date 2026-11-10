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
        // Single-image thumbnail that stores its adjustment in a DB column
        // (resource.thumbnailAdjustment), not the content-JSON sibling the
        // content components use. Kept as the fixed "imageAdjustment" key
        // (no collision risk with one image) -- Studio's
        // useAdjustmentConfigForField special-cases this via isCollectionThumbnail.
        imageAdjustment: Type.Optional(imageAdjustmentSchema),
      },
      {
        title: "Set a thumbnail image",
      },
    ),
  ),
})
