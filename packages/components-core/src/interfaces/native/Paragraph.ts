import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import { HardBreakSchema } from "../internal/HardBreak"
import { TextSchema } from "./Text"

export interface BaseParagraphProps {
  content: string
  className?: string
  id?: string
}

export const ParagraphSchema = Type.Object(
  {
    type: Type.Literal("paragraph", { default: "paragraph" }),
    content: Type.Optional(
      Type.Array(Type.Union([HardBreakSchema, TextSchema]), {
        title: "Paragraph content",
        description: "The content of the paragraph",
      }),
    ),
  },
  {
    $id: "components-native-paragraph",
    title: "Paragraph component",
    description: "A paragraph of text",
  },
)

export type ParagraphProps = Static<typeof ParagraphSchema>
