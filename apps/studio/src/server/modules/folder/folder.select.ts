import type { SelectExpression } from "kysely"

import type { DB } from "~prisma/generated/generatedTypes"

export const defaultFolderSelect = [
  "Resource.id",
  "Resource.parentId",
  "Resource.permalink",
  "Resource.title",
  "Resource.siteId",
  "Resource.state",
  "Resource.type",
  "Resource.draftBlobId",
] satisfies SelectExpression<DB, "Resource">[]
