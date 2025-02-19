import type { Static, TSchema } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type { OrderedListProps } from "./OrderedList"
import type { ParagraphProps } from "./Paragraph"
import type { UnorderedListProps } from "./UnorderedList"
import type { IsomerSiteProps, LinkComponentType } from "~/types"
import { orderedListSchemaBuilder, unorderedListSchemaBuilder } from "~/utils"
import { ParagraphSchema } from "./Paragraph"

interface ListItem {
  type: "listItem"
  content: (
    | Omit<ParagraphProps, "site">
    | Omit<OrderedListProps, "site">
    | Omit<UnorderedListProps, "site">
  )[]
}

export const listItemSchemaBuilder = <T extends TSchema, U extends TSchema>(
  orderedListSchema: T,
  unorderedListSchema: U,
) =>
  Type.Object(
    {
      type: Type.Literal("listItem", { default: "listItem" }),
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
      $id: "components-native-listItem",
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

export type ListItemProps = Static<typeof ListItemSchema> & {
  level?: number
  LinkComponent?: LinkComponentType
  site: IsomerSiteProps
}
