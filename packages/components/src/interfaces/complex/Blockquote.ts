import type { Static } from "@sinclair/typebox"
import type { Simplify } from "type-fest"
import type { IsomerPageLayoutType, IsomerSiteProps } from "~/types"
import { Type } from "@sinclair/typebox"

import { ARRAY_RADIO_FORMAT } from "../format"
import { AltTextSchema, ImageSrcSchema } from "./Image"

export const BLOCKQUOTE_STYLE = {
  imageless: "imageless",
  image: "image",
} as const

const BlockquoteBaseSchema = Type.Object({
  type: Type.Literal("blockquote", { default: "blockquote" }),
  quote: Type.String({
    title: "Quote",
    format: "textarea",
  }),
  source: Type.String({
    title: "Source",
    description: "Speaker, their designation, or when they said it",
  }),
})

const BlockquoteWithoutImageSchema = Type.Composite(
  [
    Type.Object({
      style: Type.Literal(BLOCKQUOTE_STYLE.imageless, {
        default: BLOCKQUOTE_STYLE.imageless,
      }),
    }),
    BlockquoteBaseSchema,
  ],
  {
    title: "Without image",
  },
)

const BlockquoteWithImageSchema = Type.Composite(
  [
    Type.Object({
      style: Type.Literal(BLOCKQUOTE_STYLE.image, {
        default: BLOCKQUOTE_STYLE.image,
      }),
      // Both the image and its alt text are required for this style, so that
      // an image is never published without a descriptive alt text.
      imageSrc: ImageSrcSchema,
      imageAlt: AltTextSchema,
    }),
    BlockquoteBaseSchema,
  ],
  {
    title: "With image",
  },
)

export const BlockquoteSchema = Type.Intersect(
  [
    Type.Union([BlockquoteWithoutImageSchema, BlockquoteWithImageSchema], {
      title: "Style",
      format: ARRAY_RADIO_FORMAT,
    }),
  ],
  {
    title: "Blockquote",
    description:
      "The Blockquote component is used to display a quote with an optional image.",
  },
)

interface BlockquoteCommonProps {
  layout: IsomerPageLayoutType
  shouldLazyLoad?: boolean
  site: IsomerSiteProps
}

export type BlockquoteWithoutImageProps = Simplify<
  Static<typeof BlockquoteWithoutImageSchema> & BlockquoteCommonProps
>

export type BlockquoteWithImageProps = Simplify<
  Static<typeof BlockquoteWithImageSchema> & BlockquoteCommonProps
>

export type BlockquoteProps =
  | BlockquoteWithoutImageProps
  | BlockquoteWithImageProps
