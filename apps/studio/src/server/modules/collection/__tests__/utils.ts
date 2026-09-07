import { ResourceType } from "~prisma/generated/prisma/client"

import { db } from "../../database/database"

// Test util functions
export const getCollectionWithPermalink =  async ({
  siteId,
  permalink,
}: {
  siteId: number
  permalink: string
}) => 
  db
    .selectFrom("Resource")
    .where("type", "=", ResourceType.Collection)
    .where("siteId", "=", siteId)
    .where("permalink", "=", permalink)
    .selectAll()
    .executeTakeFirstOrThrow()


export const getCollectionItemByPermalink =  async (
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
