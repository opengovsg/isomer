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

  // "Live" if the folder/collection's own index page is published;
  // "Live · Template" if not, but something nested inside it is (the
  // dashboard auto-generates a placeholder index for these so the live
  // content underneath stays reachable); "Not live" otherwise.
  // TODO: remove_autogen has closed off new ways to reach this state, but
  // legacy data can still be in it. Once index-page autogeneration is
  // properly removed (and any remaining legacy rows backfilled),
  // "liveTemplate" should no longer be reachable and can be dropped.
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

  // Powers the "can't unpublish this landing page yet" guard in the page
  // editor — reusing this query (rather than a separate one) means
  // navigating here from the dashboard, which already fetched this same
  // data, doesn't pay for a second round-trip.
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
