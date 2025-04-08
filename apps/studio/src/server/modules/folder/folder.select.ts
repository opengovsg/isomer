import type { SelectExpression } from "kysely"

import type { DB } from "~prisma/generated/generatedTypes"

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
