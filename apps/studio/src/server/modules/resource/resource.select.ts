import type { SelectExpression } from "kysely"
import type { DB } from "~prisma/generated/generatedTypes"

// Specify the default columns to return from the Resource table
export const defaultResourceSelect = [
  "Resource.id",
  "Resource.title",
  "Resource.permalink",
  "Resource.siteId",
  "Resource.parentId",
  "Resource.publishedVersionId",
  "Resource.draftBlobId",
  "Resource.type",
  "Resource.state",
  "Resource.createdAt",
  "Resource.updatedAt",
  "Resource.scheduledAt",
  "Resource.scheduledBy",
] satisfies SelectExpression<DB, "Resource">[]

export const defaultResourceWithBlobSelect = [
  ...defaultResourceSelect,
  "Blob.content",
  "Blob.updatedAt",
] satisfies SelectExpression<DB, "Resource" | "Blob">[]
