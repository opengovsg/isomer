import type { IsomerSchema } from "@opengovsg/isomer-components"
import type { SelectExpression } from "kysely"
import { TRPCError } from "@trpc/server"
import { ResourceState } from "~prisma/generated/generatedEnums"
import { type DB } from "~prisma/generated/generatedTypes"

import { db, type SafeKysely, type Transaction } from "../database"
import { getPageById, updatePageById } from "../resource/resource.service"

interface Version {
  id: string
  versionNum: number
}

const defaultVersionSelect: SelectExpression<DB, "Version">[] = [
  "Version.id",
  "Version.versionNum",
  "Version.resourceId",
  "Version.blobId",
  "Version.publishedAt",
]

/**
 * Get the most recent Version for a resource, by versionNum, regardless of
 * whether it is the resource's currently published version. This must be
 * keyed off Version history rather than Resource.publishedVersionId, since
 * the latter is cleared on unpublish but the version history is not.
 */
const getLatestVersionByResourceId = ({
  tx,
  resourceId,
}: {
  tx: SafeKysely
  resourceId: string
}) =>
  tx
    .selectFrom("Version")
    .where("Version.resourceId", "=", resourceId)
    .select(defaultVersionSelect)
    .orderBy("Version.versionNum", "desc")
    .limit(1)
    .executeTakeFirst()

const createVersion = async (
  db: SafeKysely,
  props: {
    versionNum: number
    resourceId: string
    blobId: string
    publisherId: string
  },
): Promise<Version> => {
  const { versionNum, resourceId, blobId, publisherId } = props
  const addedVersion = await db
    .insertInto("Version")
    .values({
      versionNum,
      resourceId: resourceId,
      blobId,
      publishedAt: new Date(),
      publishedBy: publisherId,
    })
    .returning(["Version.id", "Version.versionNum"])
    .executeTakeFirstOrThrow()

  return addedVersion
}

/**
 * Increment the version of a resource, if the resource has a draft
 * @param param0 Arguments to increment version
 * @returns The new version and the previous version, or null if there was no draft to publish
 */
export const incrementVersion = async ({
  siteId,
  resourceId,
  userId,
  tx,
}: {
  siteId: number
  tx: Transaction<DB>
  resourceId: string
  userId: string
}): Promise<{
  previousVersion: Version | null
  newVersion: Version
} | null> => {
  const page = await getPageById(tx, {
    siteId,
    resourceId: Number(resourceId),
  })

  if (!page) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Page not found",
    })
  }

  // If there's no draft, we don't create a new version
  if (!page.draftBlobId) return null

  let newVersionNum = 1
  let previousVersion: Version | null = null
  const latestVersion = await getLatestVersionByResourceId({
    tx,
    resourceId,
  })
  if (latestVersion) {
    previousVersion = latestVersion
    newVersionNum = latestVersion.versionNum + 1
  }

  // Create the new version
  const newVersion = await createVersion(tx, {
    versionNum: newVersionNum,
    resourceId,
    blobId: page.draftBlobId,
    publisherId: userId,
  })

  // Update resource with new versionId and draft to be null
  await updatePageById(
    {
      id: parseInt(page.id),
      siteId,
      publishedVersionId: newVersion.id,
      draftBlobId: null,
      state: ResourceState.Published,
    },
    tx,
  )
  return { newVersion, previousVersion }
}

export interface VersionHistoryRow {
  id: string
  versionNum: number
  publishedAt: Date
  publisher: { id: string; name: string; email: string }
  // `null` for a resource's first version, which has nothing to diff against.
  beforeContent: IsomerSchema | null
  afterContent: IsomerSchema
}

interface ListVersionHistoryProps {
  resourceId: number
  siteId: number
  cursor: number
  limit: number
}

export const listVersionHistory = async ({
  resourceId,
  siteId,
  cursor: offset,
  limit,
}: ListVersionHistoryProps): Promise<{
  items: VersionHistoryRow[]
  nextOffset: number | null
}> => {
  // Fetch one extra row: it tells us whether there's another page, and its
  // blob is the "before" content for the last row of this page.
  const rows = await db
    .selectFrom("Version")
    .innerJoin("Resource", "Resource.id", "Version.resourceId")
    .innerJoin("Blob", "Blob.id", "Version.blobId")
    .innerJoin("User", "User.id", "Version.publishedBy")
    .select([
      "Version.id",
      "Version.versionNum",
      "Version.publishedAt",
      "Blob.content",
      "User.id as publisherId",
      "User.name as publisherName",
      "User.email as publisherEmail",
    ])
    .where("Version.resourceId", "=", String(resourceId))
    .where("Resource.siteId", "=", siteId)
    .orderBy("Version.versionNum", "desc")
    .offset(offset)
    .limit(limit + 1)
    .execute()

  const hasMore = rows.length > limit

  const items = rows.slice(0, limit).map((row, index) => ({
    id: row.id,
    versionNum: row.versionNum,
    publishedAt: row.publishedAt,
    publisher: {
      id: row.publisherId,
      name: row.publisherName,
      email: row.publisherEmail,
    },
    beforeContent: rows[index + 1]?.content ?? null,
    afterContent: row.content,
  }))

  return { items, nextOffset: hasMore ? offset + limit : null }
}
