import { TRPCError } from "@trpc/server"

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
