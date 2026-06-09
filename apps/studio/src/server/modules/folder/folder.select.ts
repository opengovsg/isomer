import type { SelectExpression } from "kysely"

import type { DB } from "@isomer/db"

export const defaultFolderSelect = [
  "id",
  "parentId",
  "permalink",
  "title",
  "siteId",
  "state",
  "type",
  "draftBlobId",
] satisfies SelectExpression<DB, "Resource">[]
