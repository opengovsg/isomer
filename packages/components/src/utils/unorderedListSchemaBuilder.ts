import type { TSchema } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

export const unorderedListSchemaBuilder = <T extends TSchema>(
  listItemSchema: T,
) =>
  Type.Object(
    {
      type: Type.Literal("unorderedList", { default: "unorderedList" }),
      content: Type.Array(listItemSchema, {
        title: "List items",
        minItems: 1,
      }),
    },
    {
      $id: "components-native-unorderedList",
      title: "Unordered list component",
      description: "A list of items as bullet points",
    },
  )
