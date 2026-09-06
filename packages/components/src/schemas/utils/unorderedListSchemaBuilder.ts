import type { TSchema } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

export const unorderedListSchemaBuilder = <T extends TSchema>(
  listItemSchema: T,
) =>
  Type.Object(
    {
      content: Type.Array(listItemSchema, {
        minItems: 1,
        title: "List items",
      }),
      type: Type.Literal("unorderedList", { default: "unorderedList" }),
    },
    {
      $id: "components-native-unorderedList",
      description: "A list of items as bullet points",
      title: "Unordered list component",
    },
  )
