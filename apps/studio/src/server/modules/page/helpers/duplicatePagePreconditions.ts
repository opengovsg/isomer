import { TRPCError } from "@trpc/server"
import { ResourceType } from "~prisma/generated/generatedEnums"

import { db } from "../../database"
import { bulkValidateUserPermissionsForResources } from "../../permissions/permissions.service"
import { getPageById } from "../../resource/resource.service"

export const assertDuplicatePagePreconditions = async ({
  siteId,
  pageId,
  permalink,
  userId,
}: {
  siteId: number
  pageId: number
  permalink: string
  userId: string
}): Promise<{ parentKey: string | null }> => {
  const source = await getPageById(db, {
    resourceId: pageId,
    siteId,
  })

  if (!source || source.type !== ResourceType.Page) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Page not found",
    })
  }

  const parentKey =
    source.parentId !== null && source.parentId !== undefined
      ? String(source.parentId)
      : null

  await bulkValidateUserPermissionsForResources({
    siteId,
    action: "read",
    userId,
    resourceIds: [String(pageId)],
  })

  await bulkValidateUserPermissionsForResources({
    siteId,
    action: "create",
    userId,
    resourceIds: [parentKey],
  })

  let permalinkQuery = db
    .selectFrom("Resource")
    .where("siteId", "=", siteId)
    .where("permalink", "=", permalink)
    .select("id")

  permalinkQuery =
    parentKey === null
      ? permalinkQuery.where("parentId", "is", null)
      : permalinkQuery.where("parentId", "=", parentKey)

  const taken = await permalinkQuery.executeTakeFirst()
  if (taken) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "A resource with the same permalink already exists",
    })
  }

  return { parentKey }
}
