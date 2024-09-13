import type { DB } from "~prisma/generated/generatedTypes"

type ResourceProperties = keyof DB["Resource"]
export const defaultFolderSelect: readonly ResourceProperties[] = [
  "id",
  "parentId",
  "permalink",
  "title",
  "siteId",
  "state",
  "type",
  "draftBlobId",
] as const
