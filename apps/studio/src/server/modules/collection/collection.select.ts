import { SelectExpression } from "kysely"

import { DB } from "../database"

export const defaultCollectionSelect: SelectExpression<DB, "Resource">[] = [
  "Resource.id",
  "Resource.siteId",
  "Resource.title",
  "Resource.type",
  "Resource.permalink",
]
