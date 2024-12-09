import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type { IsomerSiteProps } from "~/types"
import { AttrsDirSchema } from "../internal/AttrsDir"
import { TextSchema } from "./Text"

// excludes 1 as it should only be used for the page title i.e ContentPageHeader
export const HeadingLevels = [2, 3, 4, 5, 6] as const
export type HeadingLevel = (typeof HeadingLevels)[number]

export const HeadingSchema = Type.Object(
  {
    type: Type.Literal("heading", { default: "heading" }),
    attrs: Type.Object({
      // Used for anchor links
      id: Type.Optional(
        Type.String({
          title: "Heading anchor ID",
          description: "The ID to use for this heading in anchor links",
        }),
      ),
      level: Type.Union(
        HeadingLevels.map((level) => Type.Literal(level)),
        {
          title: "Heading level",
          description: "The level of the heading to use",
          type: "integer",
        },
      ),
      dir: AttrsDirSchema,
    }),
    content: Type.Optional(Type.Array(TextSchema)),
  },
  {
    $id: "components-native-heading",
    title: "Heading component",
    description: "A heading element that defines a title for a section",
  },
)

export type HeadingProps = Static<typeof HeadingSchema> & {
  site: IsomerSiteProps
}
