import type { Static } from "@sinclair/typebox"
import type { IsomerSiteProps } from "~/types"
import { Type } from "@sinclair/typebox"

import { AttrsDirSchema } from "../internal/AttrsDir"
import { TextSchema } from "./Text"

// excludes 1 as it should only be used for the page title i.e ContentPageHeader
export const HeadingLevels = [2, 3, 4, 5, 6] as const

export const HeadingSchema = Type.Object(
  {
    attrs: Type.Object({
      dir: AttrsDirSchema,
      // Used for anchor links
      id: Type.Optional(
        Type.String({
          description: "The ID to use for this heading in anchor links",
          title: "Heading anchor ID",
        }),
      ),
      level: Type.Union(
        HeadingLevels.map((level) => Type.Literal(level)),
        {
          description: "The level of the heading to use",
          title: "Heading level",
          type: "integer",
        },
      ),
    }),
    content: Type.Optional(Type.Array(TextSchema)),
    type: Type.Literal("heading", { default: "heading" }),
  },
  {
    $id: "components-native-heading",
    description: "A heading element that defines a title for a section",
    title: "Heading component",
  },
)

export type HeadingProps = Static<typeof HeadingSchema> & {
  site: IsomerSiteProps
  // The actual <h#> tag to render, computed from this heading's position in
  // the page (see renderPageContent/renderComponent). `attrs.level` no longer
  // determines the tag — it only selects the visual style/font size.
  headingLevel: number
}
