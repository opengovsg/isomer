import type { Static, TSchema } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type { BaseOrderedListProps } from "./OrderedList"
import type { ParagraphProps } from "./Paragraph"
import type { BaseUnorderedListProps } from "./UnorderedList"
import type { IsomerSiteProps, IsTypeEqual, LinkComponentType } from "~/types"
import { orderedListSchemaBuilder, unorderedListSchemaBuilder } from "~/utils"
import { ParagraphSchema } from "./Paragraph"

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
export const ListItemSchema = Type.Recursive((listItemSchema) =>
  listItemSchemaBuilder(
    orderedListSchemaBuilder(listItemSchema),
    unorderedListSchemaBuilder(listItemSchema),
  ),
)

export interface BaseListItemProps {
  type: "listItem"
  content: (
    | Omit<ParagraphProps, "site">
    | BaseOrderedListProps
    | BaseUnorderedListProps
  )[]
}

type GeneratedListItemProps = Static<typeof ListItemSchema>
type ListItemTypeResult = IsTypeEqual<BaseListItemProps, GeneratedListItemProps>
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const listItemTypeCheck: boolean = true satisfies ListItemTypeResult

export type ListItemProps = any & {
  LinkComponent?: LinkComponentType
  site: IsomerSiteProps
}
