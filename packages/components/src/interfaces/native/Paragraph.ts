import type { Static } from "@sinclair/typebox"
import type { IsomerSiteProps } from "~/types"
import { Type } from "@sinclair/typebox"

import { AttrsDirSchema } from "../internal/AttrsDir"
import { HardBreakSchema } from "../internal/HardBreak"
import { TextSchema } from "./Text"

export const ParagraphSchema = Type.Object(
  {
    attrs: Type.Optional(
      Type.Object({
        dir: AttrsDirSchema,
      }),
    ),
    content: Type.Optional(
      Type.Array(Type.Union([HardBreakSchema, TextSchema]), {
        description: "The content of the paragraph",
        title: "Paragraph content",
      }),
    ),
    type: Type.Literal("paragraph", { default: "paragraph" }),
  },
  {
    $id: "components-native-paragraph",
    description: "A paragraph of text",
    title: "Paragraph component",
  },
)

export type ParagraphProps = Static<typeof ParagraphSchema> & {
  site: IsomerSiteProps
}
