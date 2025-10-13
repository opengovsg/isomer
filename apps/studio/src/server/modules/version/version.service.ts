import type { SelectExpression } from "kysely"
import { TRPCError } from "@trpc/server"
import { ResourceState } from "~prisma/generated/generatedEnums"
import { type DB } from "~prisma/generated/generatedTypes"

import type { SafeKysely, Transaction } from "../database"
import { db } from "../database"
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

export const getVersionById = ({ versionId }: { versionId: string }) =>
  db
    .selectFrom("Version")
    .where("Version.id", "=", versionId)
    .select(defaultVersionSelect)
    .executeTakeFirstOrThrow()

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
  let previousVersion: Version | null = null
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
  if (page.publishedVersionId) {
    previousVersion = await getVersionById({
      versionId: page.publishedVersionId,
    })
    newVersionNum = previousVersion.versionNum + 1
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
      ...page,
      id: parseInt(page.id),
      publishedVersionId: newVersion.id,
      draftBlobId: null,
      state: ResourceState.Published,
      siteId,
      parentId: page.parentId ? parseInt(page.parentId) : undefined,
    },
    tx,
  )
  return { newVersion, previousVersion }
}
