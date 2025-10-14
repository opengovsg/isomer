import type { BackoffOptions, JobsOptions } from "bullmq"

const DAY_IN_SECONDS = 60 * 60 * 24
/** Queue & worker settings */
export const SCHEDULED_PUBLISH_QUEUE_NAME = "{scheduled-publish-queue}"
export const SITE_PUBLISH_QUEUE_NAME = "{site-publish-queue}"

export const REMOVE_ON_COMPLETE_BUFFER = DAY_IN_SECONDS // 1 day in seconds
export const REMOVE_ON_FAIL_BUFFER = DAY_IN_SECONDS * 4 // 4 days in seconds
export const WORKER_CONCURRENCY = 5
export const WORKER_RETRY_LIMIT = 3
export const WORKER_SHUTDOWN_TIMEOUT = 30_000 // 30 seconds
export const BACKOFF: BackoffOptions = {
  type: "exponential",
  delay: 10_000, // 10s, then 20s, then 40s etc
} as const

export const defaultOpts: JobsOptions = {
  failParentOnFailure: true,
  attempts: WORKER_RETRY_LIMIT,
  backoff: BACKOFF,
}
