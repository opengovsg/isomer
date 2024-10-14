import type { SelectExpression } from "kysely"

import type { DB } from "../database"

export const defaultCollectionSelect = [
  "Resource.id",
  "Resource.siteId",
  "Resource.title",
  "Resource.type",
  "Resource.permalink",
] satisfies SelectExpression<DB, "Resource">[]
