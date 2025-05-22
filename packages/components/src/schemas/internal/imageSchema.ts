import { Type } from "@sinclair/typebox"

import { AltTextSchema, generateImageSrcSchema } from "~/interfaces/complex"

export const imageSchemaObject = Type.Object({
  image: Type.Optional(
    Type.Object({
      src: generateImageSrcSchema({
        title: "Thumbnail",
        description:
          "Upload an image if you want to have a custom thumbnail for this item",
      }),
      alt: AltTextSchema,
    }),
  ),
})
