import { Type, type Static, type TSchema } from "@sinclair/typebox"
import { ParagraphSchema } from "./Paragraph"
import { orderedListSchemaBuilder, unorderedListSchemaBuilder } from "~/utils"

export const listItemSchemaBuilder = <T extends TSchema, U extends TSchema>(
  orderedListSchema: T,
  unorderedListSchema: U,
) =>
  Type.Object(
    {
      type: Type.Literal("listItem"),
      content: Type.Array(
        Type.Union([ParagraphSchema, orderedListSchema, unorderedListSchema]),
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

export const ListItemSchema = Type.Recursive((listItemSchema) =>
  listItemSchemaBuilder(
    orderedListSchemaBuilder(listItemSchema),
    unorderedListSchemaBuilder(listItemSchema),
  ),
)

export type ListItemProps = Static<typeof ListItemSchema>
