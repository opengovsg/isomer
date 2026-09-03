import { TRPCError } from "@trpc/server"
import { add } from "date-fns"

import type { SafeKysely } from "../database"
import { ResourceType } from "../database"
import {
  getChildLiveStatusMap,
  getDescendantResourceIdsUnsafeForScheduledUnpublish,
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

  // Whether some descendant would block this landing page's unpublish no
  // matter how far out it's scheduled — i.e. it's live with no unpublish
  // scheduled at all (or scheduled to come back up). Checked against a
  // stand-in date 100 years out: if a descendant is still unsafe against a
  // cutoff that far away, no real scheduled date could ever save it, so it's
  // a true blocker rather than a "will resolve itself, just not yet" case. A
  // descendant that's live today but already has its own scheduled
  // unpublish doesn't count here — scheduling this landing page's unpublish
  // for on/after that time will work once it's picked, which
  // scheduleUnpublish validates for real against the actual chosen date
  // (see getDescendantResourceIdsUnsafeForScheduledUnpublish's other call
  // site in page.service.ts). This only decides whether the "Unpublish
  // later" flow is worth offering at all.
  const unschedulableDescendantCount = (
    await getDescendantResourceIdsUnsafeForScheduledUnpublish(trx, {
      siteId,
      resourceId,
      scheduledAt: add(new Date(), { years: 100 }),
    })
  ).filter((id) => id !== indexPage.id).length

  return {
    title,
    ...indexPage,
    liveStatus,
    parentType,
    otherPublishedDescendantCount,
    unschedulableDescendantCount,
  }
}
