import type { SelectExpression, Transaction } from "kysely"
import { type DB } from "~prisma/generated/generatedTypes"

import type { SafeKysely } from "../database"
import { db } from "../database"

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
