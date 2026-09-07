import { isDefinedNumber } from "~/utils/truthiness"

import type { SafeKysely, ResourceState } from "../database/types"
import type { Page } from "./resource.types"
import { db } from "../database/database"
import { ResourceType } from "../database/types"
import { defaultResourceSelect } from "./resource.select"

// NOTE: Base method for retrieving a resource - no distinction made on whether `blobId` exists
export const getById = (
  kysely: SafeKysely,
  { resourceId, siteId }: { resourceId: number; siteId: number },
) =>
  kysely
    .selectFrom("Resource")
    .where("Resource.id", "=", String(resourceId))
    .where("siteId", "=", siteId)

// There are 7 types of pages this get query supports:
// Page, CollectionPage, RootPage, IndexPage, CollectionLink, FolderMeta, CollectionMeta
export const getPageById = async (
  kysely: SafeKysely,
  args: { resourceId: number; siteId: number },
) =>
  await getById(kysely, args)
    .where((eb) =>
      eb.or([
        eb("type", "=", ResourceType.Page),
        eb("type", "=", ResourceType.CollectionPage),
        eb("type", "=", ResourceType.RootPage),
        eb("type", "=", ResourceType.IndexPage),
        eb("type", "=", ResourceType.CollectionLink),
        eb("type", "=", ResourceType.FolderMeta),
        eb("type", "=", ResourceType.CollectionMeta),
      ]),
    )
    .select(defaultResourceSelect)
    .executeTakeFirst()

export const updatePageById = async (
  page: {
    id: number
    siteId: number
    state?: ResourceState
    parentId?: number
  } & Partial<
    Pick<
      Page,
      | "title"
      | "scheduledAt"
      | "scheduledBy"
      | "publishedVersionId"
      | "draftBlobId"
    >
  >,
  dbInstance?: SafeKysely,
) => {
  const kysely = dbInstance ?? db
  const { id, parentId, ...rest } = page
  const updateValues = { ...rest }
  if (isDefinedNumber(parentId)) {
    updateValues.parentId = String(parentId)
  }

  return await kysely
    .updateTable("Resource")
    .set(updateValues)
    .where("siteId", "=", page.siteId)
    .where("id", "=", String(id))
    .returningAll()
    .executeTakeFirst()
}
