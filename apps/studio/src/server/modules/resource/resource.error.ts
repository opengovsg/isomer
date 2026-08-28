import { TRPCError } from "@trpc/server"
import { format } from "date-fns"

/**
 * Thrown by `unpublishPageResource` when the page is not currently published
 * — including the "was already unpublished by the time the cron ran" case.
 * A distinct class (rather than matching on `error.message`) so callers like
 * the scheduled-publishing cron can distinguish this from other failures
 * without depending on exact error copy.
 */
export class PageAlreadyUnpublishedError extends TRPCError {
  constructor() {
    super({
      code: "PRECONDITION_FAILED",
      message: "This page is not currently published",
    })
    this.name = "PageAlreadyUnpublishedError"
  }
}

/**
 * Thrown by `publishPageResource`/`unpublishPageResource` when the page has a
 * schedule pending in the opposite direction (e.g. publishing a page with a
 * scheduled unpublish) — the two would conflict, so the caller must cancel
 * the schedule first. A same-direction schedule is not an error: the manual
 * action just runs immediately and clears it (see callers).
 */
export class ScheduledActionConflictError extends TRPCError {
  constructor(scheduledAction: "published" | "unpublished", scheduledAt: Date) {
    super({
      code: "PRECONDITION_FAILED",
      message: `This page is scheduled to be ${scheduledAction} at ${format(
        scheduledAt,
        "yyyy-MM-dd HH:mm",
      )}. Cancel the schedule before continuing.`,
    })
    this.name = "ScheduledActionConflictError"
  }
}

/**
 * Thrown by `publishPageResource`/`schedulePublish` when a Folder/Collection
 * above the target page isn't live yet — a page can't go live (or be
 * scheduled to) before the container that renders it. Distinct from
 * `AncestorScheduledUnpublishLockError`: this is about a container that was
 * never published (or hasn't caught up yet), not one that's about to go dark.
 */
export class AncestorIndexPageNotLiveError extends TRPCError {
  constructor() {
    super({
      code: "PRECONDITION_FAILED",
      message:
        "This page's containing folder or collection isn't published yet. Publish it (and any of its own parent folders) before publishing this page.",
    })
    this.name = "AncestorIndexPageNotLiveError"
  }
}

/**
 * Thrown by `publishPageResource`/`schedulePublish`/the page-creation
 * mutations when a Folder/Collection above the target has a pending
 * scheduled unpublish — an unconditional lock (not a time comparison): once
 * a container is scheduled to go dark, nothing underneath it may be
 * published, scheduled to publish, or created until that schedule fires or
 * is cancelled.
 */
export class AncestorScheduledUnpublishLockError extends TRPCError {
  constructor(scheduledAt: Date) {
    super({
      code: "PRECONDITION_FAILED",
      message: `A folder or collection above this page is scheduled to be unpublished at ${format(
        scheduledAt,
        "yyyy-MM-dd HH:mm",
      )}. Cancel that schedule before publishing, scheduling, or creating pages here.`,
    })
    this.name = "AncestorScheduledUnpublishLockError"
  }
}
