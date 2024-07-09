import type { Static } from "@sinclair/typebox"
import { Type } from "@sinclair/typebox"

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

export type UnorderedListProps = Static<typeof UnorderedListSchema>
