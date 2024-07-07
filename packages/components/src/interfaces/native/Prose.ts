import { Type, type Static } from "@sinclair/typebox"
import { DividerSchema } from "./Divider"
import { HeadingSchema } from "./Heading"
import { OrderedListSchema } from "./OrderedList"
import { ParagraphSchema } from "./Paragraph"
import { TableSchema } from "./Table"
import { UnorderedListSchema } from "./UnorderedList"

export const ProseSchema = Type.Object({
  type: Type.Literal("prose"),
  content: Type.Array(
    Type.Union([
      DividerSchema,
      HeadingSchema,
      OrderedListSchema,
      ParagraphSchema,
      TableSchema,
      UnorderedListSchema,
    ]),
    {
      title: "Content block",
      description: "A collection of native content components.",
      minItems: 1,
    },
  ),
})

export type ProseProps = Static<typeof ProseSchema>
export type ProseContent = ProseProps["content"]
