import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type { IsomerSiteProps } from "~/types"
import { HardBreakSchema } from "../internal/HardBreak"
import { TextSchema } from "./Text"

export interface BaseParagraphProps {
  type: "paragraph"
  content: string
  className?: string
  id?: string
  LinkComponent?: any // Next.js link
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

export type ParagraphProps = Static<typeof ParagraphSchema> &
  Pick<BaseParagraphProps, "LinkComponent"> & {
    site: IsomerSiteProps
  }
