import { Type, type Static, type TSchema } from "@sinclair/typebox"
import { ParagraphProps, ParagraphSchema } from "./Paragraph"
import { orderedListSchemaBuilder, unorderedListSchemaBuilder } from "~/utils"
import { OrderedListProps } from "./OrderedList"
import { UnorderedListProps } from "./UnorderedList"

interface ListItem {
  type: "listItem"
  content: Array<ParagraphProps | OrderedListProps | UnorderedListProps>
}

export const listItemSchemaBuilder = <T extends TSchema, U extends TSchema>(
  orderedListSchema: T,
  unorderedListSchema: U,
) =>
  Type.Object(
    {
      type: Type.Literal("listItem"),
      content: Type.Array(
        Type.Union([
          Type.Ref(ParagraphSchema),
          Type.Ref(orderedListSchema),
          Type.Ref(unorderedListSchema),
        ]),
        {
          title: "List item contents",
          minItems: 1,
        },
      ),
    },
    {
      title: "List item component",
      description:
        "A list item that can contain paragraphs or nested ordered lists and unordered lists",
    },
  )

// NOTE: The ListItem interface and the underlying ListItemSchema needs to be
// in sync with each other. Unsafe is used here to bypass errors in TypeScript
// where the type instantiation is too deep.
export const ListItemSchema = Type.Unsafe<ListItem>(
  Type.Recursive((listItemSchema) =>
    listItemSchemaBuilder(
      orderedListSchemaBuilder(listItemSchema),
      unorderedListSchemaBuilder(listItemSchema),
    ),
  ),
)

export type ListItemProps = Static<typeof ListItemSchema>
