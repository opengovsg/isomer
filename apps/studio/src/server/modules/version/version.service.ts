import type { SelectExpression, Transaction } from "kysely"
import { type DB } from "~prisma/generated/generatedTypes"

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
  props: {
    versionNum: number
    resourceId: number
    blobId: number
  },
  tx?: Transaction<DB>,
) => {
  const { versionNum, resourceId, blobId } = props
  const instance = tx ? tx : db
  const addedVersion = await instance
    .insertInto("Version")
    .values({
      versionNum: String(versionNum),
      resourceId: String(resourceId),
      blobId: String(blobId),
      publishedAt: new Date(),
    })
    .returning("Version.id")
    .executeTakeFirstOrThrow()

  return { versionId: addedVersion.id }
}
