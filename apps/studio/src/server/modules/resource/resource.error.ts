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
