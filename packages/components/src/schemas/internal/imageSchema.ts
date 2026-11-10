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
        // Single-image thumbnail. Its adjustment lives in the content JSON at
        // content.page.image.imageAdjustment; resource.service.ts surfaces it
        // via a SQL alias named thumbnailAdjustment. It keeps the fixed
        // "imageAdjustment" key rather than the field-named sibling the content
        // components use. One image means no collision, so the fixed key is
        // safe. Studio's useAdjustmentConfigForField special-cases it via
        // isCollectionThumbnail.
        imageAdjustment: Type.Optional(imageAdjustmentSchema),
      },
      {
        title: "Set a thumbnail image",
      },
    ),
  ),
})
