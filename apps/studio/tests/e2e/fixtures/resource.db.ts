import { db } from "~/server/modules/database"
import { type ResourceType } from "~prisma/generated/generatedEnums"

export const getResourceByTitle = (opts: { siteId: number; title: string }) =>
  db
    .selectFrom("Resource")
    .where("siteId", "=", opts.siteId)
    .where("title", "=", opts.title)
    .select(["id", "state", "type", "parentId"])
    .executeTakeFirst()

export const getResourceByTitleAndType = (opts: {
  siteId: number
  title: string
  type: ResourceType
}) =>
  db
    .selectFrom("Resource")
    .where("siteId", "=", opts.siteId)
    .where("title", "=", opts.title)
    .where("type", "=", opts.type)
    .select(["id", "type"])
    .executeTakeFirst()

export const countResourcesByParent = (opts: {
  siteId: number
  parentId: string
  type: ResourceType
}) =>
  db
    .selectFrom("Resource")
    .where("siteId", "=", opts.siteId)
    .where("parentId", "=", opts.parentId)
    .where("type", "=", opts.type)
    .select("id")
    .execute()
    .then((rows) => rows.length)

export const getResource = (resourceId: string) =>
  db
    .selectFrom("Resource")
    .where("id", "=", resourceId)
    .selectAll()
    .executeTakeFirst()

export const getResourceDraftBlobContent = async (resourceId: string) => {
  const row = await db
    .selectFrom("Resource")
    .innerJoin("Blob", "Blob.id", "Resource.draftBlobId")
    .where("Resource.id", "=", resourceId)
    .select("Blob.content")
    .executeTakeFirst()
  if (!row?.content) return ""
  return JSON.stringify(row.content)
}
