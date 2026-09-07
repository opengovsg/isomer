/* oxlint-disable eslint/no-shadow -- server lint cleanup */
import type { SelectExpression } from "kysely"
import type { DB } from "~prisma/generated/generatedTypes"
import { TRPCError } from "@trpc/server"
import { hasNonEmptyString } from "~/utils/truthiness"
import { ResourceState } from "~prisma/generated/generatedEnums"

import type { SafeKysely, Transaction } from "../database/types"
import { db } from "../database/database"
import { getPageById, updatePageById } from "../resource/resource.page"

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

const getVersionById = async ({ versionId }: { versionId: string }) =>
  await db
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
      blobId,
      publishedAt: new Date(),
      publishedBy: publisherId,
      resourceId,
      versionNum,
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
    resourceId: Number(resourceId),
    siteId,
  })

  if (page === undefined) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Page not found",
    })
  }

  // If there's no draft, we don't create a new version
  if (!hasNonEmptyString(page.draftBlobId)) {
    return null
  }

  let newVersionNum = 1
  let previousVersion: Version | null = null
  if (hasNonEmptyString(page.publishedVersionId)) {
    previousVersion = await getVersionById({
      versionId: page.publishedVersionId,
    })
    newVersionNum = previousVersion.versionNum + 1
  }

  // Create the new version
  const newVersion = await createVersion(tx, {
    blobId: page.draftBlobId,
    publisherId: userId,
    resourceId,
    versionNum: newVersionNum,
  })

  // Update resource with new versionId and draft to be null
  await updatePageById(
    {
      draftBlobId: null,
      id: Math.trunc(Number(page.id)),
      publishedVersionId: newVersion.id,
      siteId,
      state: ResourceState.Published,
    },
    tx,
  )
  return { newVersion, previousVersion }
}
