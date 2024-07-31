import type { SelectExpression } from "kysely"
import { type DB } from "~prisma/generated/generatedTypes"

import type { SafeKysely } from "../database"
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

const createVersion = async (
  db: SafeKysely,
  props: {
    versionNum: number
    resourceId: number
    blobId: number
    publisherId: string
  },
) => {
  const { versionNum, resourceId, blobId, publisherId } = props
  const addedVersion = await db
    .insertInto("Version")
    .values({
      versionNum,
      resourceId: String(resourceId),
      blobId: String(blobId),
      publishedAt: new Date(),
      publishedBy: publisherId,
    })
    .returning("Version.id")
    .executeTakeFirstOrThrow()

  return { versionId: addedVersion.id }
}

export const addNewVersion = async ({
  siteId,
  pageId,
  userId,
}: {
  siteId: number
  pageId: number
  userId: string
}) => {
  return await db.transaction().execute(async (tx) => {
    const page = await getPageById(tx, { siteId, resourceId: pageId })

    if (!page.draftBlobId) {
      return { error: "No drafts to publish for this page" }
    }

    let newVersionNum = 1
    if (page.publishedVersionId) {
      const currentVersion = await getVersionById({
        versionId: page.publishedVersionId,
      })
      newVersionNum = Number(currentVersion.versionNum) + 1
    }

    // Create the new version
    // TODO: To pass in the tx object
    const newVersion = await createVersion(tx, {
      versionNum: newVersionNum,
      resourceId: pageId,
      blobId: Number(page.draftBlobId),
      publisherId: userId,
    })

    // Update resource with new versionId and draft to be null
    await updatePageById(
      {
        ...page,
        id: parseInt(page.id),
        publishedVersionId: newVersion.versionId,
        draftBlobId: null,
        state: "Published",
        siteId,
        parentId: page.parentId ? parseInt(page.parentId) : undefined,
      },
      tx,
    )
    return { versionId: newVersion }
  })
}
