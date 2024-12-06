import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type { IsomerSiteProps, LinkComponentType } from "~/types"
import { BaseProseSchema } from "../native/Prose"

export const ContentpicSchema = Type.Object(
  {
    type: Type.Literal("contentpic", { default: "contentpic" }),
    content: BaseProseSchema,
    imageSrc: Type.String({
      title: "Image",
      format: "image",
    }),
    imageAlt: Type.Optional(
      Type.String({
        title: "Alternate text",
        maxLength: 120,
        description:
          "Add a descriptive alternative text for this image. This helps visually impaired users to understand your image.",
      }),
    ),
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
}
