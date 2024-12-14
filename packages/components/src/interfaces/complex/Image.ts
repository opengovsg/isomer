import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type { IsomerSiteProps } from "~/types"
import { ARRAY_RADIO_FORMAT } from "../format"

export const generateImageSrcSchema = ({
  description,
}: {
  description?: string
}) => {
  return Type.String({
    title: "Image",
    format: "image",
    description,
  })
}

export const ImageSrcSchema = generateImageSrcSchema({})

export const AltTextSchema = Type.String({
  title: "Alternate text",
  maxLength: 120,
  description:
    "Add a descriptive text so that visually impaired users can understand your image",
})

export const ImageSchema = Type.Object(
  {
    type: Type.Literal("image", { default: "image" }),
    src: ImageSrcSchema,
    alt: AltTextSchema,
    caption: Type.Optional(
      Type.String({
        title: "Caption",
        maxLength: 100,
        format: "textarea",
      }),
    ),
    size: Type.Optional(
      Type.Union(
        [
          Type.Literal("default", { title: "Fill page width (recommended)" }),
          Type.Literal("smaller", { title: "Small" }),
        ],
        {
          title: "Image size",
          description:
            "On mobile, images will always fill up to the page width even if you choose “Small”.",
          format: ARRAY_RADIO_FORMAT,
          type: "string",
          default: "default",
        },
      ),
    ),
  },
  {
    title: "Image component",
  },
)

export type ImageProps = Static<typeof ImageSchema> & {
  site: IsomerSiteProps
}
