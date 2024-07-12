import type { TSchema } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

export const orderedListSchemaBuilder = <T extends TSchema>(
  listItemSchema: T,
) =>
  Type.Object(
    {
      type: Type.Literal("orderedList"),
      attrs: Type.Optional(
        Type.Object({
          start: Type.Optional(
            Type.Number({
              title: "Starting number",
              description: "The number to start the ordered list at",
            }),
          ),
        }),
      ),
      content: Type.Array(listItemSchema, {
        title: "List items",
        minItems: 1,
      }),
    },
    {
      $id: "components-native-orderedList",
      title: "Ordered list component",
      description: "A list of items that have numbers as bullets",
    },
  )
