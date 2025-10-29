import { Type } from "@sinclair/typebox"

import { AltTextSchema, generateImageSrcSchema } from "~/interfaces/complex"

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
      },
      {
        title: "Set a thumbnail image",
      },
    ),
  ),
})
