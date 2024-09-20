import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type { BaseListItemProps } from "./ListItem"
import type { IsomerSiteProps, IsTypeEqual, LinkComponentType } from "~/types"
import { orderedListSchemaBuilder, unorderedListSchemaBuilder } from "~/utils"
import { listItemSchemaBuilder } from "./ListItem"

export const OrderedListSchema = orderedListSchemaBuilder(
  Type.Recursive((listItemSchema) =>
    listItemSchemaBuilder(
      orderedListSchemaBuilder(listItemSchema),
      unorderedListSchemaBuilder(listItemSchema),
    ),
  ),
)

export interface BaseOrderedListProps {
  type: "orderedList"
  attrs?: {
    start?: number
  }
  content: BaseListItemProps[]
}
type GeneratedOrderedListProps = Static<typeof OrderedListSchema>
type OrderedListTypeResult = IsTypeEqual<
  BaseOrderedListProps,
  GeneratedOrderedListProps
>
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const orderedListTypeCheck: boolean = true satisfies OrderedListTypeResult

export type OrderedListProps = any & {
  LinkComponent?: LinkComponentType
  site: IsomerSiteProps
}
