import { Type, type Static } from "@sinclair/typebox"
import { ListItemSchema } from "./ListItem"

export const BaseOrderedListSchema = Type.Object({
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
})

export const OrderedListSchema = Type.Composite(
  [
    BaseOrderedListSchema,
    Type.Object({
      content: Type.Array(ListItemSchema, {
        title: "List items",
        minItems: 1,
      }),
    }),
  ],
  {
    title: "Ordered list component",
    description: "A list of items that have numbers as bullets",
  },
)

// export const OrderedListSchema = Type.Object(
//   {
//     type: Type.Literal("orderedList"),
//     attrs: Type.Optional(
//       Type.Object({
//         start: Type.Optional(
//           Type.Number({
//             title: "Starting number",
//             description: "The number to start the ordered list at",
//           }),
//         ),
//       }),
//     ),
//     content: Type.Array(ListItemSchema, {
//       title: "List items",
//       minItems: 1,
//     }),
//   },
//   {
//     title: "Ordered list component",
//     description: "A list of items that have numbers as bullets",
//   },
// )

export type OrderedListProps = Static<typeof OrderedListSchema>
