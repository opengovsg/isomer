import type { SelectExpression } from "kysely"
import { TRPCError } from "@trpc/server"
import { ResourceState } from "~prisma/generated/generatedEnums"
import { type DB } from "~prisma/generated/generatedTypes"

import type { SafeKysely, Transaction } from "../database"
import { db } from "../database"
import { getPageById, updatePageById } from "../resource/resource.service"

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

export const createVersion = async (
  db: SafeKysely,
  props: {
    versionNum: number
    resourceId: string
    blobId: string
    publisherId: string
  },
) => {
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

  return { versionId: addedVersion.id, versionNum: addedVersion.versionNum }
}

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
}) => {
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

  if (!page.draftBlobId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "No drafts to publish for this page",
    })
  }

  let newVersionNum = 1
  if (page.publishedVersionId) {
    const currentVersion = await getVersionById({
      versionId: page.publishedVersionId,
    })
    newVersionNum = Number(currentVersion.versionNum) + 1
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
      publishedVersionId: newVersion.versionId,
      draftBlobId: null,
      state: ResourceState.Published,
      siteId,
      parentId: page.parentId ? parseInt(page.parentId) : undefined,
    },
    tx,
  )
  return newVersion
}
