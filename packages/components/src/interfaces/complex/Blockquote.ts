import type { Static } from "@sinclair/typebox"
import type { IsomerPageLayoutType, IsomerSiteProps } from "~/types"
import { Type } from "@sinclair/typebox"

import { AltTextSchema, ImageSrcSchema } from "./Image"

export const BlockquoteSchema = Type.Object(
  {
    // NOTE: We are making the image optional but the alt text required as a hack,
    // because the schema does not support having dependent properties. If no
    // image is provided, the alt text will be ignored
    imageAlt: Type.Optional(AltTextSchema),
    imageSrc: Type.Optional(ImageSrcSchema),
    quote: Type.String({
      format: "textarea",
      title: "Quote",
    }),
    source: Type.String({
      description: "Speaker, their designation, or when they said it",
      title: "Source",
    }),
    type: Type.Literal("blockquote", { default: "blockquote" }),
  },
  {
    description:
      "The Blockquote component is used to display a quote with an image.",
    title: "Blockquote",
  },
)

export type BlockquoteProps = Static<typeof BlockquoteSchema> & {
  layout: IsomerPageLayoutType
  shouldLazyLoad?: boolean
  site: IsomerSiteProps
}
