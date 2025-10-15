import type { JobsOptions } from "bullmq"

const DAY_IN_SECONDS = 60 * 60 * 24

/** Queue & worker settings */
export const SCHEDULED_PUBLISH_QUEUE_NAME = "{scheduled-publish-queue}"
export const SITE_PUBLISH_QUEUE_NAME = "{site-publish-queue}"
export const REMOVE_ON_COMPLETE_BUFFER = DAY_IN_SECONDS // 1 day in seconds
export const REMOVE_ON_FAIL_BUFFER = DAY_IN_SECONDS * 4 // 4 days in seconds
export const WORKER_CONCURRENCY = 5
export const WORKER_RETRY_LIMIT = 3
export const WORKER_SHUTDOWN_TIMEOUT = 30_000 // 30 seconds

/** Schedule publish job settings */
export const SITE_PUBLISH_BUFFER_SECONDS = 10
export const SCHEDULED_AT_TOLERANCE_SECONDS = 60
// Deliberately kept short to allow for quick retries in case of transient failures
export const schedulePublishJobOpts: JobsOptions = {
  failParentOnFailure: true,
  attempts: WORKER_RETRY_LIMIT,
  backoff: {
    type: "exponential",
    delay: 1_000, // 1s, then 2s, then 4s etc
  },
} as const

/** Site publish job settings */
// Deliberately kept long since we send API requests to codebuild which can sometimes take a while to respond
export const sitePublishJobOpts: JobsOptions = {
  failParentOnFailure: true,
  attempts: WORKER_RETRY_LIMIT,
  backoff: {
    type: "exponential",
    delay: 10_000, // 10s, then 20s, then 40s etc
  } as const,
}

/** Redlock keyspaces for resource locking */
export const RESOURCE_REDIS_KEYSPACE = "resource-lock"
export const SITE_REDIS_KEYSPACE = "site-lock"
