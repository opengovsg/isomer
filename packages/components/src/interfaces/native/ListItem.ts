import type { Static, TSchema } from "@sinclair/typebox"
import type { IsomerSiteProps } from "~/types"
import { Type } from "@sinclair/typebox"
import {
  orderedListSchemaBuilder,
  unorderedListSchemaBuilder,
} from "~/schemas/utils"

import type { OrderedListProps } from "./OrderedList"
import type { ParagraphProps } from "./Paragraph"
import type { UnorderedListProps } from "./UnorderedList"
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
      content: Type.Array(
        Type.Union([
          Type.Ref(ParagraphSchema),
          Type.Ref(orderedListSchema),
          Type.Ref(unorderedListSchema),
        ]),
        {
          minItems: 1,
          title: "List item contents",
        },
      ),
      type: Type.Literal("listItem", { default: "listItem" }),
    },
    {
      $id: "components-native-listItem",
      description:
        "A list item that can contain paragraphs or nested ordered lists and unordered lists",
      title: "List item component",
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
  site: IsomerSiteProps
}
