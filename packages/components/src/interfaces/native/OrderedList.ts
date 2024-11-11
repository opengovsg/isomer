import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

import type { IsomerSiteProps, LinkComponentType } from "~/types"
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

export type OrderedListProps = Static<typeof OrderedListSchema> & {
  level?: number
  LinkComponent?: LinkComponentType
  site: IsomerSiteProps
}
