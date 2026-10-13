import { db } from "~/server/modules/database"
import { ResourceType } from "~prisma/generated/generatedEnums"

export const getFolderByTitle = (opts: { siteId: number; title: string }) =>
  db
    .selectFrom("Resource")
    .where("siteId", "=", opts.siteId)
    .where("title", "=", opts.title)
    .where("type", "=", ResourceType.Folder)
    .select("id")
    .executeTakeFirstOrThrow()

export const getCollectionByTitle = (opts: { siteId: number; title: string }) =>
  db
    .selectFrom("Resource")
    .where("siteId", "=", opts.siteId)
    .where("title", "=", opts.title)
    .where("type", "=", ResourceType.Collection)
    .select("id")
    .executeTakeFirstOrThrow()

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

export const listResourcesByParent = (opts: {
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

export const getResource = (resourceId: string) =>
  db
    .selectFrom("Resource")
    .where("id", "=", resourceId)
    .selectAll()
    .executeTakeFirst()

export const getResourceId = async (resourceId: string) => {
  const row = await db
    .selectFrom("Resource")
    .where("id", "=", resourceId)
    .select("id")
    .executeTakeFirst()
  return row?.id ?? null
}

export const getResourceParentId = async (resourceId: string) => {
  const row = await db
    .selectFrom("Resource")
    .where("id", "=", resourceId)
    .select("parentId")
    .executeTakeFirst()
  return row?.parentId ?? null
}

export const getResourceTitle = async (resourceId: string) => {
  const row = await db
    .selectFrom("Resource")
    .where("id", "=", resourceId)
    .select("title")
    .executeTakeFirst()
  return row?.title ?? null
}

export const getResourceState = async (resourceId: string) => {
  const row = await db
    .selectFrom("Resource")
    .where("id", "=", resourceId)
    .select("state")
    .executeTakeFirst()
  return row?.state ?? null
}

export const getResourceDraftBlobId = async (resourceId: string) => {
  const row = await db
    .selectFrom("Resource")
    .where("id", "=", resourceId)
    .select("draftBlobId")
    .executeTakeFirst()
  return row?.draftBlobId ?? null
}

export const getResourcePermalink = async (resourceId: string) => {
  const row = await db
    .selectFrom("Resource")
    .where("id", "=", resourceId)
    .select("permalink")
    .executeTakeFirst()
  return row?.permalink ?? null
}

export const getResourceScheduledAt = async (resourceId: string) => {
  const row = await db
    .selectFrom("Resource")
    .where("id", "=", resourceId)
    .select("scheduledAt")
    .executeTakeFirst()
  return row?.scheduledAt ?? null
}

export const getResourceScheduledBy = async (resourceId: string) => {
  const row = await db
    .selectFrom("Resource")
    .where("id", "=", resourceId)
    .select("scheduledBy")
    .executeTakeFirst()
  return row?.scheduledBy ?? null
}

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

export const getResourceDraftTagged = async (resourceId: string) => {
  const resource = await db
    .selectFrom("Resource")
    .where("id", "=", resourceId)
    .select("draftBlobId")
    .executeTakeFirst()
  if (!resource?.draftBlobId) return undefined

  const blob = await db
    .selectFrom("Blob")
    .where("id", "=", resource.draftBlobId)
    .select("content")
    .executeTakeFirstOrThrow()

  return (blob.content as { page?: { tagged?: string[] } }).page?.tagged
}
