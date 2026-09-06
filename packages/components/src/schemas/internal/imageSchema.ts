import { Type } from "@sinclair/typebox"
import {
  generateImageSrcSchema,
  AltTextSchema,
} from "~/interfaces/complex/Image"

// NOTE: This is only for thumbnail images in various places, a refactor would
// be required if this is used in other places
export const imageSchemaObject = Type.Object({
  image: Type.Optional(
    Type.Object(
      {
        alt: AltTextSchema,
        src: generateImageSrcSchema({
          description:
            "Upload an image if you want to have a custom thumbnail for this item",
          title: "Thumbnail",
        }),
      },
      {
        title: "Set a thumbnail image",
      },
    ),
  ),
})
