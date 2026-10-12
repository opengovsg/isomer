import { db, sql } from "~/server/modules/database"
import { ResourceType } from "~prisma/generated/generatedEnums"

/** Matches migration 20240912052239 `update_timestamp` on Resource. */
const RESOURCE_UPDATED_AT_TRIGGER = "update_timestamp"

/**
 * Sets Resource.updatedAt without the moddatetime trigger overwriting it.
 * Disables the trigger for the duration of the update and always re-enables it.
 */
export const setResourceUpdatedAt = async (
  resourceId: string,
  updatedAt: Date,
) => {
  const updatedPage = await db.transaction().execute(async (trx) => {
    await sql`ALTER TABLE "Resource" DISABLE TRIGGER ${sql.id(RESOURCE_UPDATED_AT_TRIGGER)}`.execute(
      trx,
    )
    try {
      return await trx
        .updateTable("Resource")
        .set({ updatedAt })
        .where("id", "=", resourceId)
        .returningAll()
        .executeTakeFirstOrThrow()
    } finally {
      await sql`ALTER TABLE "Resource" ENABLE TRIGGER ${sql.id(RESOURCE_UPDATED_AT_TRIGGER)}`.execute(
        trx,
      )
    }
  })

  if (updatedPage.updatedAt.getTime() !== updatedAt.getTime()) {
    throw new Error(
      `Resource ${resourceId} updatedAt did not persist (expected ${updatedAt.toISOString()}, got ${updatedPage.updatedAt.toISOString()})`,
    )
  }

  return updatedPage
}

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
