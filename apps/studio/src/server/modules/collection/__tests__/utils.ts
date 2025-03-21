import { ResourceType } from "@prisma/client"

import { db } from "../../database"

// Test util functions
export const getCollectionWithPermalink = ({
  siteId,
  permalink,
}: {
  siteId: number
  permalink: string
}) => {
  return db
    .selectFrom("Resource")
    .where("type", "=", ResourceType.Collection)
    .where("siteId", "=", siteId)
    .where("permalink", "=", permalink)
    .selectAll()
    .executeTakeFirstOrThrow()
}

export const getCollectionItemByPermalink = (
  permalink: string,
  parentId?: string | null,
) => {
  if (parentId) {
    return db
      .selectFrom("Resource")
      .where("parentId", "=", parentId)
      .where("permalink", "=", permalink)
      .selectAll()
      .executeTakeFirstOrThrow()
  }

  return db
    .selectFrom("Resource")
    .where("parentId", "is", null)
    .where("permalink", "=", permalink)
    .selectAll()
    .executeTakeFirstOrThrow()
}

export const assertAuditLogRows = async (numRows = 0) => {
  const actual = await db.selectFrom("AuditLog").selectAll().execute()

  expect(actual).toHaveLength(numRows)
}
