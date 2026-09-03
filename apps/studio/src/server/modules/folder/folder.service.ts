import { TRPCError } from "@trpc/server"

import type { SafeKysely } from "../database"
import { ResourceType } from "../database"
import {
  getChildLiveStatusMap,
  getPublishedDescendantResourceIds,
  selectLastPublishedAt,
} from "../resource/resource.service"

export const getFolderIndexPageInfo = async (
  trx: SafeKysely,
  { siteId, resourceId }: { siteId: number; resourceId: string },
) => {
  const { title, type: parentType } = await trx
    .selectFrom("Resource")
    .where("Resource.siteId", "=", siteId)
    .where("Resource.id", "=", resourceId)
    .select(["title", "type"])
    .executeTakeFirstOrThrow()

  const indexPage = await trx
    .selectFrom("Resource")
    .where("Resource.siteId", "=", siteId)
    .where("Resource.parentId", "=", resourceId)
    .where("Resource.type", "=", ResourceType.IndexPage)
    .select((eb) => [
      "id",
      "draftBlobId",
      "publishedVersionId",
      "scheduledAt",
      "scheduledAction",
      selectLastPublishedAt(eb),
    ])
    .executeTakeFirstOrThrow(
      () =>
        new TRPCError({
          code: "NOT_FOUND",
          message: "No existing index page found",
        }),
    )

  // "liveTemplate" covers auto-generated placeholder index pages that
  // aren't published themselves but have published descendants.
  const childLiveStatus = await getChildLiveStatusMap(trx, {
    siteId,
    resourceId,
  })
  const liveStatus: "live" | "liveTemplate" | "notLive" =
    indexPage.publishedVersionId !== null
      ? "live"
      : [...childLiveStatus.values()].some((s) => s.hasLiveDescendant)
        ? "liveTemplate"
        : "notLive"

  // Reused by the page editor's "can't unpublish yet" guard.
  const otherPublishedDescendantCount = (
    await getPublishedDescendantResourceIds(trx, { siteId, resourceId })
  ).filter((id) => id !== indexPage.id).length

  return {
    title,
    ...indexPage,
    liveStatus,
    parentType,
    otherPublishedDescendantCount,
  }
}
