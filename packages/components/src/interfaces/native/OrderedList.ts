import { Type, type Static } from "@sinclair/typebox"
import { listItemSchemaBuilder } from "./ListItem"
import { orderedListSchemaBuilder, unorderedListSchemaBuilder } from "~/utils"

export const OrderedListSchema = orderedListSchemaBuilder(
  Type.Recursive((listItemSchema) =>
    listItemSchemaBuilder(
      orderedListSchemaBuilder(listItemSchema),
      unorderedListSchemaBuilder(listItemSchema),
    ),
  ),
)

export type OrderedListProps = Static<typeof OrderedListSchema>
