import { Type, type Static, type TSchema } from "@sinclair/typebox"

export const unorderedListSchemaBuilder = <T extends TSchema>(
  listItemSchema: T,
) =>
  Type.Object(
    {
      type: Type.Literal("unorderedList"),
      content: Type.Array(listItemSchema, {
        title: "List items",
        minItems: 1,
      }),
    },
    {
      title: "Unordered list component",
      description: "A list of items as bullet points",
    },
  )
