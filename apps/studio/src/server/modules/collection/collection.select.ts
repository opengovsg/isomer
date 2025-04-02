import type { SelectExpression } from "kysely"

import type { DB } from "../database"

export const defaultCollectionSelect = [
  "id",
  "siteId",
  "title",
  "type",
  "permalink",
] satisfies SelectExpression<DB, "Resource">[]
