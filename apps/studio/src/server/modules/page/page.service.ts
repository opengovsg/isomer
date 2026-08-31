import type { UnwrapTagged } from "type-fest"
import type { NEW_PAGE_LAYOUT_VALUES } from "~/schemas/page"
import {
  DEFAULT_CHILDREN_PAGES_BLOCK,
  ISOMER_USABLE_PAGE_LAYOUTS,
} from "@opengovsg/isomer-components"
import { TRPCError } from "@trpc/server"
import { format, isBefore } from "date-fns"
import {
  AuditLogEvent,
  ResourceType,
  ScheduledAction,
} from "~prisma/generated/generatedEnums"

import type { Resource } from "../database"
import { logResourceEvent } from "../audit/audit.service"
import { db } from "../database"
import { AncestorScheduledUnpublishLockError } from "../resource/resource.error"
import {
  getAncestorIndexPages,
  getDescendantResourceIdsUnsafeForScheduledUnpublish,
  getLockingAncestorIndexPages,
  getPageById,
  hasDescendantWithPendingScheduledAction,
  resolveEffectiveResourceId,
  UNPUBLISH_PAGE_NOT_FOUND_MESSAGE,
  updatePageById,
} from "../resource/resource.service"
import { getUserById } from "../user/user.service"

export const createDefaultPage = ({
  layout,
}: {
  layout: (typeof NEW_PAGE_LAYOUT_VALUES)[number]
}) => {
  switch (layout) {
    case "content": {
      const contentDefaultPage = {
        layout: ISOMER_USABLE_PAGE_LAYOUTS.Content,
        page: { contentPageHeader: { summary: "This is the page summary" } },
        content: [],
        version: "0.1.0",
      } satisfies UnwrapTagged<PrismaJson.BlobJsonContent>
      return contentDefaultPage
    }

    case "article": {
      const articleDefaultPage = {
        layout: ISOMER_USABLE_PAGE_LAYOUTS.Article,
        page: {
          date: format(new Date(), "dd/MM/yyyy"),
          category: "Feature Articles",
          articlePageHeader: { summary: "This is the page summary" },
        },
        content: [],
        version: "0.1.0",
      } satisfies UnwrapTagged<PrismaJson.BlobJsonContent>

      return articleDefaultPage
    }

    case "database": {
      const databaseDefaultPage = {
        layout: ISOMER_USABLE_PAGE_LAYOUTS.Database,
        page: {
          contentPageHeader: { summary: "This is the page summary" },
          database: {
            dataSource: {
              type: "dgs", // we only support DGS creation on studio for now
              // Hardcoded: One of the most popular datasets on Data.gov.sg, so unlikely to be removed
              // Either way, this is just a placeholder, unlikely agency will publish with this
              resourceId: "d_3c55210de27fcccda2ed0c63fdd2b352",
            },
          },
        },
        content: [],
        version: "0.1.0",
      } satisfies UnwrapTagged<PrismaJson.BlobJsonContent>

      return databaseDefaultPage
    }

    default: {
      const _exhaustiveCheck: never = layout
      return _exhaustiveCheck
    }
  }
}

export const createFolderIndexPage = (title: string) => {
  return {
    version: "0.1.0",
    layout: ISOMER_USABLE_PAGE_LAYOUTS.Index,
    // NOTE: cannot use placeholder values here
    // because this are used for generation of breadcrumbs
    // and the page title
    page: {
      title,
      lastModified: new Date().toISOString(),
      contentPageHeader: { summary: `Pages in ${title}` },
    },
    content: [DEFAULT_CHILDREN_PAGES_BLOCK],
  } satisfies UnwrapTagged<PrismaJson.BlobJsonContent>
}

interface SchedulePublishParams {
  userId: string
  siteId: number
  pageId: number
  scheduledAt: Date
}

export const schedulePublish = async ({
  userId,
  siteId,
  pageId,
  scheduledAt,
}: SchedulePublishParams): Promise<Resource> => {
  if (isBefore(scheduledAt, new Date())) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Scheduled time must be in the future",
    })
  }

  const by = await getUserById(userId)

  return db.transaction().execute(async (tx) => {
    // pageId may be a Folder/Collection id shorthand for its landing page —
    // resolve inside the transaction, same as publishPageResource does via
    // getFullPageById, so the input contract matches the immediate-publish
    // flow exactly.
    const resolvedResourceId = await resolveEffectiveResourceId(tx, {
      resourceId: pageId,
      siteId,
    })
    // fetch the resource to be scheduled inside the transaction, to guard against concurrent update issues (race conditions)
    const resource = await getPageById(tx, {
      resourceId: resolvedResourceId,
      siteId,
    })
    if (!resource) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Resource not found",
      })
    }
    if (resource.scheduledAt) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Page already has a scheduled action at ${format(resource.scheduledAt, "yyyy-MM-dd HH:mm")}`,
      })
    }

    // A pending ancestor scheduled-unpublish locks out scheduling a publish
    // underneath it, at any nesting depth, regardless of timing (see
    // getLockingAncestorIndexPages).
    const ancestorIndexPages = await getAncestorIndexPages(tx, {
      siteId,
      resourceId: resource.id,
    })
    const [lockingAncestor] = getLockingAncestorIndexPages(ancestorIndexPages)
    if (lockingAncestor?.scheduledAt) {
      throw new AncestorScheduledUnpublishLockError(lockingAncestor.scheduledAt)
    }

    const updatedPage = await updatePageById(
      {
        id: resolvedResourceId,
        siteId,
        scheduledAt,
        scheduledBy: by.id,
        scheduledAction: ScheduledAction.Publish,
      },
      tx,
    )
    if (!updatedPage) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to schedule page",
      })
    }
    await logResourceEvent(tx, {
      siteId,
      by,
      delta: { before: resource, after: updatedPage },
      eventType: AuditLogEvent.SchedulePublish,
    })
    return updatedPage
  })
}

interface ScheduleUnpublishParams {
  userId: string
  siteId: number
  pageId: number
  scheduledAt: Date
}

export const scheduleUnpublish = async ({
  userId,
  siteId,
  pageId,
  scheduledAt,
}: ScheduleUnpublishParams): Promise<Resource> => {
  if (isBefore(scheduledAt, new Date())) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Scheduled time must be in the future",
    })
  }

  const by = await getUserById(userId)

  return db.transaction().execute(async (tx) => {
    // pageId may be a Folder/Collection id shorthand for its landing page —
    // resolve inside the transaction, same as unpublishPageResource does via
    // getFullPageById, so the input contract matches unpublishPage exactly.
    const resolvedResourceId = await resolveEffectiveResourceId(tx, {
      resourceId: pageId,
      siteId,
    })
    const resource = await getPageById(tx, {
      resourceId: resolvedResourceId,
      siteId,
    })
    if (!resource) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: UNPUBLISH_PAGE_NOT_FOUND_MESSAGE,
      })
    }
    if (!resource.publishedVersionId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "This page is not currently published",
      })
    }
    if (resource.scheduledAt) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Page already has a scheduled action at ${format(resource.scheduledAt, "yyyy-MM-dd HH:mm")}`,
      })
    }

    // Schedule-time analogue of unpublishPageResource's container-siblings
    // guard: block scheduling a folder/collection's landing page to unpublish
    // while another page inside it won't be safely down by then. The
    // execution-time guard still runs when this fires (see
    // unpublishPageResource) — this only gives the caller earlier feedback.
    if (resource.type === ResourceType.IndexPage && resource.parentId) {
      // resourceId here is the container (parent) whose subtree is walked;
      // the IndexPage being scheduled is itself part of that subtree and is
      // still published/unscheduled at this point, so it must be excluded
      // from the result the same way getPublishedDescendantResourceIds's
      // callers exclude the resource being unpublished (see
      // unpublishPageResource's container-siblings guard).
      const unsafeDescendantIds = (
        await getDescendantResourceIdsUnsafeForScheduledUnpublish(tx, {
          siteId,
          resourceId: resource.parentId,
          scheduledAt,
        })
      ).filter((id) => id !== resource.id)
      if (unsafeDescendantIds.length > 0) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message:
            "This folder or collection has other pages that won't be unpublished by then — unpublish or schedule them first.",
        })
      }
    }

    const updatedPage = await updatePageById(
      {
        id: resolvedResourceId,
        siteId,
        scheduledAt,
        scheduledBy: by.id,
        scheduledAction: ScheduledAction.Unpublish,
      },
      tx,
    )
    if (!updatedPage) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to schedule unpublish",
      })
    }
    await logResourceEvent(tx, {
      siteId,
      by,
      delta: { before: resource, after: updatedPage },
      eventType: AuditLogEvent.ScheduleUnpublish,
    })
    return updatedPage
  })
}

interface CancelSchedulePublishParams {
  userId: string
  siteId: number
  pageId: number
}

export const cancelSchedulePublish = async ({
  userId,
  siteId,
  pageId,
}: CancelSchedulePublishParams): Promise<Resource> => {
  const by = await getUserById(userId)

  return db.transaction().execute(async (tx) => {
    const resolvedResourceId = await resolveEffectiveResourceId(tx, {
      resourceId: pageId,
      siteId,
    })
    const resource = await getPageById(tx, {
      resourceId: resolvedResourceId,
      siteId,
    })
    if (!resource) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Resource not found",
      })
    }
    // A resource scheduled before scheduledAction existed has it as null;
    // the cron treats that null the same as Publish (see
    // schedulePublishingJob.ts), so cancellation must match that convention
    // rather than requiring an exact enum match.
    const effectiveScheduledAction =
      resource.scheduledAction ?? ScheduledAction.Publish
    if (
      !resource.scheduledAt ||
      effectiveScheduledAction !== ScheduledAction.Publish
    ) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message:
          "Unable to cancel schedule for a page that is not scheduled to be published",
      })
    }

    // If this index page isn't live yet, a child page may have scheduled its
    // own publish assuming this one would land first. Cancelling this
    // schedule out from under it would leave that child's schedule
    // unenforceable, so require the child schedules to be cancelled first —
    // a hard block, not an auto-cascade.
    if (
      resource.type === ResourceType.IndexPage &&
      resource.parentId &&
      !resource.publishedVersionId
    ) {
      const hasPendingChildPublish =
        await hasDescendantWithPendingScheduledAction(tx, {
          siteId,
          resourceId: resource.parentId,
          excludeResourceId: resource.id,
          action: ScheduledAction.Publish,
        })
      if (hasPendingChildPublish) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Cancel the scheduled publish for its child pages first.",
        })
      }
    }

    const updatedPage = await updatePageById(
      {
        id: resolvedResourceId,
        siteId,
        scheduledAt: null,
        scheduledBy: null,
        scheduledAction: null,
      },
      tx,
    )
    if (!updatedPage) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to cancel page schedule",
      })
    }
    await logResourceEvent(tx, {
      siteId,
      by,
      delta: { before: resource, after: updatedPage },
      eventType: AuditLogEvent.CancelSchedulePublish,
    })
    return updatedPage
  })
}

interface CancelScheduleUnpublishParams {
  userId: string
  siteId: number
  pageId: number
}

export const cancelScheduleUnpublish = async ({
  userId,
  siteId,
  pageId,
}: CancelScheduleUnpublishParams): Promise<Resource> => {
  const by = await getUserById(userId)

  return db.transaction().execute(async (tx) => {
    const resolvedResourceId = await resolveEffectiveResourceId(tx, {
      resourceId: pageId,
      siteId,
    })
    const resource = await getPageById(tx, {
      resourceId: resolvedResourceId,
      siteId,
    })
    if (!resource) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: UNPUBLISH_PAGE_NOT_FOUND_MESSAGE,
      })
    }
    const effectiveScheduledAction =
      resource.scheduledAction ?? ScheduledAction.Publish
    if (
      !resource.scheduledAt ||
      effectiveScheduledAction !== ScheduledAction.Unpublish
    ) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message:
          "Unable to cancel schedule for a page that is not scheduled to be unpublished",
      })
    }

    // A child page may already be scheduled to unpublish assuming this
    // container's unpublish lands first (or at the same time). Cancelling
    // this schedule out from under it would leave the child's own schedule
    // dangling, so require the child schedules to be cancelled first — a
    // hard block, not an auto-cascade.
    if (resource.type === ResourceType.IndexPage && resource.parentId) {
      const hasPendingChildUnpublish =
        await hasDescendantWithPendingScheduledAction(tx, {
          siteId,
          resourceId: resource.parentId,
          excludeResourceId: resource.id,
          action: ScheduledAction.Unpublish,
        })
      if (hasPendingChildUnpublish) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Cancel the scheduled unpublish for its child pages first.",
        })
      }
    }

    const updatedPage = await updatePageById(
      {
        id: resolvedResourceId,
        siteId,
        scheduledAt: null,
        scheduledBy: null,
        scheduledAction: null,
      },
      tx,
    )
    if (!updatedPage) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to cancel scheduled unpublish",
      })
    }
    await logResourceEvent(tx, {
      siteId,
      by,
      delta: { before: resource, after: updatedPage },
      eventType: AuditLogEvent.CancelScheduleUnpublish,
    })
    return updatedPage
  })
}
