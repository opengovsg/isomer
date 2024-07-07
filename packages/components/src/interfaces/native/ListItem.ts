import { Type, type Static } from "@sinclair/typebox"
import { ParagraphSchema } from "./Paragraph"
import { BaseOrderedListSchema } from "./OrderedList"
import { BaseUnorderedListSchema } from "./UnorderedList"

export const BaseListItemSchema = Type.Object({
  type: Type.Literal("listItem"),
})

// Note: The content key is a recursive schema and the definitions from both
// OrderedList and UnorderedList are duplicated here to prevent circular
// dependencies
// FIXME: This gives a circular dependency error
export const ListItemSchema = Type.Recursive(
  (listItemSchema) =>
    Type.Composite([
      BaseListItemSchema,
      Type.Object({
        content: Type.Array(
          Type.Union([
            ParagraphSchema,
            Type.Composite([
              BaseOrderedListSchema,
              Type.Object({
                content: Type.Array(listItemSchema),
              }),
            ]),
            Type.Composite([
              BaseUnorderedListSchema,
              Type.Object({
                content: Type.Array(listItemSchema),
              }),
            ]),
          ]),
          {
            title: "List item contents",
            minItems: 1,
          },
        ),
      }),
    ]),
  {
    title: "List item component",
    description:
      "A list item that can contain paragraphs or nested ordered lists and unordered lists",
  },
)

// export const ListItemSchema = Type.Recursive(
//   (listItemSchema) =>
//     Type.Composite([
//       BaseListItemSchema,
//       Type.Object({
//         content: Type.Array(
//           Type.Union([
//             ParagraphSchema,
//             Type.Object(
//               {
//                 type: Type.Literal("orderedList"),
//                 attrs: Type.Optional(
//                   Type.Object({
//                     start: Type.Optional(
//                       Type.Number({
//                         title: "Starting number",
//                         description: "The number to start the ordered list at",
//                       }),
//                     ),
//                   }),
//                 ),
//                 content: Type.Array(listItemSchema, {
//                   title: "List items",
//                   minItems: 1,
//                 }),
//               },
//               {
//                 title: "Ordered list component",
//                 description: "A list of items that have numbers as bullets",
//               },
//             ),
//             Type.Object(
//               {
//                 type: Type.Literal("unorderedList"),
//                 content: Type.Array(listItemSchema, {
//                   title: "List items",
//                   minItems: 1,
//                 }),
//               },
//               {
//                 title: "Unordered list component",
//                 description: "A list of items as bullet points",
//               },
//             ),
//           ]),
//           {
//             title: "List item contents",
//             minItems: 1,
//           },
//         ),
//       }),
//     ]),
//   {
//     title: "List item component",
//     description:
//       "A list item that can contain paragraphs or nested ordered lists and unordered lists",
//   },
// )

export type ListItemProps = Static<typeof ListItemSchema>
