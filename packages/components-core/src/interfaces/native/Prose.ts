import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import { DividerSchema } from "./Divider"
import { HeadingSchema } from "./Heading"
import { OrderedListSchema } from "./OrderedList"
import { ParagraphSchema } from "./Paragraph"
import { TableSchema } from "./Table"
import { UnorderedListSchema } from "./UnorderedList"

const BASE_PROSE_META = {
  title: "Content block",
  description: "A collection of native content components.",
  format: "prose",
}

const generateProseSchema = (id?: string) => {
  return Type.Object(
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
          },
        ),
      ),
    },
    {
      ...(id && { $id: id }),
      ...BASE_PROSE_META,
    },
  )
}

export const ProseSchema = generateProseSchema("components-native-prose")
export const BaseProseSchema = generateProseSchema()

export type ProseProps = Static<typeof ProseSchema>
export type ProseContent = ProseProps["content"]
