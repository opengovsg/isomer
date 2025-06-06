import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type { IsomerSiteProps, LinkComponentType } from "~/types"
import { ContentpicProseSchema } from "../native/Prose"
import { AltTextSchema, ImageSrcSchema } from "./Image"

export const ContentpicSchema = Type.Object(
  {
    type: Type.Literal("contentpic", { default: "contentpic" }),
    imageSrc: ImageSrcSchema,
    imageAlt: AltTextSchema,
    content: ContentpicProseSchema,
  },
  {
    title: "Contentpic component",
    description:
      "The contentpic component is used to display an image with accompanying text only in content pages",
  },
)

export type ContentpicProps = Static<typeof ContentpicSchema> & {
  LinkComponent?: LinkComponentType
  site: IsomerSiteProps
  shouldLazyLoad?: boolean
}
