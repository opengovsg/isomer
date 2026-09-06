import type { TSchema } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

export const orderedListSchemaBuilder = <T extends TSchema>(
  listItemSchema: T,
) =>
  Type.Object(
    {
      attrs: Type.Optional(
        Type.Object({
          start: Type.Optional(
            Type.Number({
              description: "The number to start the ordered list at",
              title: "Starting number",
            }),
          ),
        }),
      ),
      content: Type.Array(listItemSchema, {
        minItems: 1,
        title: "List items",
      }),
      type: Type.Literal("orderedList", { default: "orderedList" }),
    },
    {
      $id: "components-native-orderedList",
      description: "A list of items that have numbers as bullets",
      title: "Ordered list component",
    },
  )
