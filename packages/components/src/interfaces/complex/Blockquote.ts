import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type { IsomerPageLayoutType, IsomerSiteProps } from "~/types"
import { AltTextSchema, ImageSrcSchema } from "./Image"

export const BlockquoteSchema = Type.Object(
  {
    type: Type.Literal("blockquote", { default: "blockquote" }),
    quote: Type.String({
      title: "Quote",
      format: "textarea",
    }),
    source: Type.String({
      title: "Source",
      description: "Speaker, their designation, or when they said it",
    }),
    // NOTE: We are making the image optional but the alt text required as a hack,
    // because the schema does not support having dependent properties. If no
    // image is provided, the alt text will be ignored
    imageSrc: Type.Optional(ImageSrcSchema),
    // Setting as optional because the image is optional.
    // If no image is provided and this is required, the schema will throw an error,
    // making it impossible to create a blockquote without an image on Studio
    imageAlt: Type.Optional(AltTextSchema),
  },
  {
    title: "Blockquote component",
    description:
      "The Blockquote component is used to display a quote with an image.",
  },
)

export type BlockquoteProps = Static<typeof BlockquoteSchema> & {
  layout: IsomerPageLayoutType
  shouldLazyLoad?: boolean
  site: IsomerSiteProps
}
