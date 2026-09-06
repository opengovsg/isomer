import type { Static } from "@sinclair/typebox"
import type { IsomerSiteProps } from "~/types"
import { Type } from "@sinclair/typebox"

import { ContentpicProseSchema } from "../native/Prose"
import { AltTextSchema, ImageSrcSchema } from "./Image"

export const ContentpicSchema = Type.Object(
  {
    content: ContentpicProseSchema,
    imageAlt: AltTextSchema,
    imageSrc: ImageSrcSchema,
    type: Type.Literal("contentpic", { default: "contentpic" }),
  },
  {
    description:
      "The contentpic component is used to display an image with accompanying text only in content pages",
    title: "Image with text",
  },
)

export type ContentpicProps = Static<typeof ContentpicSchema> & {
  site: IsomerSiteProps
  shouldLazyLoad?: boolean
  headingLevel: number
}
