import { Type, type Static } from "@sinclair/typebox"
import { ListItemSchema } from "./ListItem"

export const BaseUnorderedListSchema = Type.Object({
  type: Type.Literal("unorderedList"),
})

export const UnorderedListSchema = Type.Composite(
  [
    BaseUnorderedListSchema,
    Type.Object({
      content: Type.Array(ListItemSchema, {
        title: "List items",
        minItems: 1,
      }),
    }),
  ],
  {
    title: "Unordered list component",
    description: "A list of items as bullet points",
  },
)

// export const UnorderedListSchema = Type.Object(
//   {
//     type: Type.Literal("unorderedList"),
//     content: Type.Array(ListItemSchema, {
//       title: "List items",
//       minItems: 1,
//     }),
//   },
//   {
//     title: "Unordered list component",
//     description: "A list of items as bullet points",
//   },
// )

export type UnorderedListProps = Static<typeof UnorderedListSchema>
