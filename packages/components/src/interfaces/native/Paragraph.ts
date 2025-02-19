import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type { AttrsDirProps } from "../internal/AttrsDir"
import type { IsomerSiteProps, LinkComponentType } from "~/types"
import { AttrsDirSchema } from "../internal/AttrsDir"
import { HardBreakSchema } from "../internal/HardBreak"
import { TextSchema } from "./Text"

export interface BaseParagraphProps {
  type: "paragraph"
  content: string
  className?: string
  attrs?: {
    dir?: AttrsDirProps
  }
  id?: string
  site: IsomerSiteProps
  LinkComponent?: LinkComponentType
}

export const ParagraphSchema = Type.Object(
  {
    type: Type.Literal("paragraph", { default: "paragraph" }),
    attrs: Type.Optional(
      Type.Object({
        dir: AttrsDirSchema,
      }),
    ),
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

export type ParagraphProps = Static<typeof ParagraphSchema> &
  Pick<BaseParagraphProps, "site" | "LinkComponent">
