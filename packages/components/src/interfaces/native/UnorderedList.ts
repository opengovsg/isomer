import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type { BaseListItemProps } from "./ListItem"
import type { IsomerSiteProps, IsTypeEqual, LinkComponentType } from "~/types"
import { orderedListSchemaBuilder, unorderedListSchemaBuilder } from "~/utils"
import { listItemSchemaBuilder } from "./ListItem"

export const UnorderedListSchema = unorderedListSchemaBuilder(
  Type.Recursive((listItemSchema) =>
    listItemSchemaBuilder(
      orderedListSchemaBuilder(listItemSchema),
      unorderedListSchemaBuilder(listItemSchema),
    ),
  ),
)

export interface BaseUnorderedListProps {
  type: "unorderedList"
  content: BaseListItemProps[]
}
type GeneratedUnorderedListProps = Static<typeof UnorderedListSchema>
type UnorderedListTypeResult = IsTypeEqual<
  BaseUnorderedListProps,
  GeneratedUnorderedListProps
>
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const unorderedListTypeCheck: boolean = true satisfies UnorderedListTypeResult

export type UnorderedListProps = any & {
  LinkComponent?: LinkComponentType
  site: IsomerSiteProps
}
