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
  ScheduledAction,
} from "~prisma/generated/generatedEnums"

import type { Resource } from "../database"
import { logResourceEvent } from "../audit/audit.service"
import { db } from "../database"
import { bulkValidateUserPermissionsForResources } from "../permissions/permissions.service"
import { getPageById, updatePageById } from "../resource/resource.service"

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

interface ScheduleActionParams {
  userId: string
  siteId: number
  pageId: number
  scheduledAt: Date
  action: ScheduledAction
  permissionAction: "publish" | "unpublish"
  // whether the page must currently be published for this action to be schedulable (true for unpublish, false for publish)
  requiresPublished: boolean
  auditEvent:
    | typeof AuditLogEvent.SchedulePublish
    | typeof AuditLogEvent.ScheduleUnpublish
  alreadyScheduledMessage: (scheduledAt: Date) => string
  failedMessage: string
  sendConfirmationEmail: (args: {
    resource: Resource
    scheduledAt: Date
    recipientEmail: string
  }) => Promise<void>
}

// Shared body for schedulePage/scheduleUnpublish: they differ only in the
// scheduled action, permission, published-state precondition, audit event,
// error copy, and confirmation email.
export const scheduleAction = async ({
  userId,
  siteId,
  pageId,
  scheduledAt,
  action,
  permissionAction,
  requiresPublished,
  auditEvent,
  alreadyScheduledMessage,
  failedMessage,
  sendConfirmationEmail,
}: ScheduleActionParams) => {
  await bulkValidateUserPermissionsForResources({
    siteId,
    action: permissionAction,
    userId,
  })

  if (isBefore(scheduledAt, new Date())) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Scheduled time must be in the future",
    })
  }
  const by = await db
    .selectFrom("User")
    .where("id", "=", userId)
    .selectAll()
    .executeTakeFirstOrThrow()

  const updatedPage = await db.transaction().execute(async (tx) => {
    // fetch the resource to be scheduled inside the transaction, to guard against concurrent update issues (race conditions)
    const resource = await getPageById(tx, { resourceId: pageId, siteId })
    if (!resource) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Resource not found",
      })
    }
    if (requiresPublished && !resource.publishedVersionId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "This page is not currently published",
      })
    }
    if (resource.scheduledAt) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: alreadyScheduledMessage(resource.scheduledAt),
      })
    }
    // update the resource's scheduled field
    const updatedPage = await updatePageById(
      {
        id: pageId,
        siteId,
        scheduledAt,
        scheduledBy: by.id,
        scheduledAction: action,
      },
      tx,
    )
    // verify that the update was successful
    if (!updatedPage) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: failedMessage,
      })
    }
    await logResourceEvent(tx, {
      siteId,
      by,
      delta: { before: resource, after: updatedPage },
      eventType: auditEvent,
    })
    return updatedPage
  })
  await sendConfirmationEmail({
    resource: updatedPage,
    scheduledAt,
    recipientEmail: by.email,
  })
}

interface CancelScheduleActionParams {
  userId: string
  siteId: number
  pageId: number
  action: ScheduledAction
  permissionAction: "publish" | "unpublish"
  auditEvent:
    | typeof AuditLogEvent.CancelSchedulePublish
    | typeof AuditLogEvent.CancelScheduleUnpublish
  notScheduledMessage: string
  failedMessage: string
  sendConfirmationEmail: (args: {
    resource: Resource
    recipientEmail: string
  }) => Promise<void>
}

// Shared body for cancelSchedulePage/cancelScheduleUnpublish: they differ
// only in the scheduled action being cancelled, permission, audit event,
// error copy, and confirmation email.
export const cancelScheduleAction = async ({
  userId,
  siteId,
  pageId,
  action,
  permissionAction,
  auditEvent,
  notScheduledMessage,
  failedMessage,
  sendConfirmationEmail,
}: CancelScheduleActionParams) => {
  await bulkValidateUserPermissionsForResources({
    siteId,
    action: permissionAction,
    userId,
  })
  const by = await db
    .selectFrom("User")
    .where("id", "=", userId)
    .selectAll()
    .executeTakeFirstOrThrow()
  const updatedPage = await db.transaction().execute(async (tx) => {
    const resource = await getPageById(tx, { resourceId: pageId, siteId })
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
    if (!resource.scheduledAt || effectiveScheduledAction !== action) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: notScheduledMessage,
      })
    }

    // update the resource's scheduled field
    const updatedPage = await updatePageById(
      {
        id: pageId,
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
        message: failedMessage,
      })
    }
    await logResourceEvent(tx, {
      siteId,
      by,
      delta: { before: resource, after: updatedPage },
      eventType: auditEvent,
    })
    return updatedPage
  })
  await sendConfirmationEmail({
    resource: updatedPage,
    recipientEmail: by.email,
  })
}
