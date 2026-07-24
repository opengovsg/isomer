import { db } from "~/server/modules/database"

export const getResourceByTitle = (opts: { siteId: number; title: string }) =>
  db
    .selectFrom("Resource")
    .where("siteId", "=", opts.siteId)
    .where("title", "=", opts.title)
    .select(["id", "state", "type", "parentId"])
    .executeTakeFirst()

const getResource = (resourceId: string) =>
  db
    .selectFrom("Resource")
    .where("id", "=", resourceId)
    .selectAll()
    .executeTakeFirst()

export const getResourceState = async (resourceId: string) =>
  (await getResource(resourceId))?.state ?? null

export const getResourceTitle = async (resourceId: string) =>
  (await getResource(resourceId))?.title ?? null

export const getResourcePermalink = async (resourceId: string) =>
  (await getResource(resourceId))?.permalink ?? null

export const getResourceScheduledAt = async (resourceId: string) =>
  (await getResource(resourceId))?.scheduledAt ?? null

export const getResourceScheduledBy = async (resourceId: string) =>
  (await getResource(resourceId))?.scheduledBy ?? null

export const getResourceDraftBlobId = async (resourceId: string) =>
  (await getResource(resourceId))?.draftBlobId ?? null

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
