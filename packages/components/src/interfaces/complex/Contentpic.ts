import type { Static } from "@sinclair/typebox"
import type { IsomerSiteProps } from "~/types"
import { Type } from "@sinclair/typebox"

import { ARRAY_RADIO_FORMAT } from "../format"
import { ContentpicProseSchema } from "../native/Prose"
import { AltTextSchema, ImageSrcSchema } from "./Image"

export const CONTENTPIC_ORIENTATION = {
  ImageFirst: { value: "imageFirst", label: "Image first (Default)" },
  TextFirst: { value: "textFirst", label: "Text first" },
} as const

export const CONTENTPIC_SIZE = {
  Default: { value: "default", label: "Default" },
  HalfHalf: { value: "halfHalf", label: "Half-half" },
} as const

export const ContentpicSchema = Type.Object(
  {
    type: Type.Literal("contentpic", { default: "contentpic" }),
    imageSrc: ImageSrcSchema,
    imageAlt: AltTextSchema,
    orientation: Type.Optional(
      Type.Union(
        [
          Type.Literal(CONTENTPIC_ORIENTATION.ImageFirst.value, {
            title: CONTENTPIC_ORIENTATION.ImageFirst.label,
          }),
          Type.Literal(CONTENTPIC_ORIENTATION.TextFirst.value, {
            title: CONTENTPIC_ORIENTATION.TextFirst.label,
          }),
        ],
        {
          title: "Orientation",
          default: CONTENTPIC_ORIENTATION.ImageFirst.value,
          format: ARRAY_RADIO_FORMAT,
        },
      ),
    ),
    size: Type.Optional(
      Type.Union(
        [
          Type.Literal(CONTENTPIC_SIZE.Default.value, {
            title: CONTENTPIC_SIZE.Default.label,
          }),
          Type.Literal(CONTENTPIC_SIZE.HalfHalf.value, {
            title: CONTENTPIC_SIZE.HalfHalf.label,
          }),
        ],
        {
          title: "Size",
          default: CONTENTPIC_SIZE.Default.value,
          format: ARRAY_RADIO_FORMAT,
        },
      ),
    ),
    content: ContentpicProseSchema,
  },
  {
    title: "Image with text",
    description:
      "The contentpic component is used to display an image with accompanying text only in content pages",
  },
)

export type ContentpicProps = Static<typeof ContentpicSchema> & {
  site: IsomerSiteProps
  shouldLazyLoad?: boolean
}
