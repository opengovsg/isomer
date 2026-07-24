import { db } from "~/server/modules/database"

export const getResourceByTitle = (opts: { siteId: number; title: string }) =>
  db
    .selectFrom("Resource")
    .where("siteId", "=", opts.siteId)
    .where("title", "=", opts.title)
    .select(["id", "state", "type", "parentId"])
    .executeTakeFirst()

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
