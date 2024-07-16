import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import { DividerSchema } from "./Divider"
import { HeadingSchema } from "./Heading"
import { OrderedListSchema } from "./OrderedList"
import { ParagraphSchema } from "./Paragraph"
import { TableSchema } from "./Table"
import { UnorderedListSchema } from "./UnorderedList"

export const ProseSchema = Type.Object(
  {
    type: Type.Literal("prose"),
    content: Type.Optional(
      Type.Array(
        Type.Union([
          Type.Ref(DividerSchema),
          Type.Ref(HeadingSchema),
          Type.Ref(OrderedListSchema),
          Type.Ref(ParagraphSchema),
          Type.Ref(TableSchema),
          Type.Ref(UnorderedListSchema),
        ]),
        {
          title: "Content block",
          description: "A collection of native content components.",
          minItems: 1,
          format: "prose"
        },
      ),
    ),
  },
  {
    $id: "components-native-prose",
    title: "Content block",
    description: "A collection of native content components.",
  },
)

export type ProseProps = Static<typeof ProseSchema>
export type ProseContent = ProseProps["content"]
