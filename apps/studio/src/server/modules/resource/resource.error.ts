import { TRPCError } from "@trpc/server"
import { format } from "date-fns"

/**
 * Thrown by `unpublishPageResource` when the page isn't currently published.
 * A distinct class so callers (e.g. the scheduling cron) can match on it
 * instead of `error.message`.
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
 * Thrown when a page has a schedule pending in the opposite direction (e.g.
 * publishing a page with a scheduled unpublish); the caller must cancel the
 * schedule first. A same-direction schedule is not an error.
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
 * Thrown when a Folder/Collection above the target has a pending scheduled
 * unpublish: an unconditional lock, regardless of timing, until that
 * schedule fires or is cancelled.
 */
export class AncestorScheduledUnpublishLockError extends TRPCError {
  constructor(scheduledAt: Date) {
    super({
      code: "PRECONDITION_FAILED",
      message: `A folder or collection above this page is scheduled to be unpublished at ${format(
        scheduledAt,
        "yyyy-MM-dd HH:mm",
      )}. Cancel that schedule before publishing or scheduling this page.`,
    })
    this.name = "AncestorScheduledUnpublishLockError"
  }
}
