import type { BackoffOptions, JobsOptions } from "bullmq"
import { Queue } from "bullmq"

import type { ScheduledPublishJobData } from "./schedule-publish"
import { defaultOpts, RedisClient } from "../utils"

/** Queue settings */
export const SCHEDULED_PUBLISH_QUEUE_NAME = "scheduled-publish-queue"
export const REMOVE_ON_COMPLETE_BUFFER = 60 * 60 * 24 // 1 day in seconds
export const REMOVE_ON_FAIL_BUFFER = 60 * 60 * 24 * 4 // 4 days in seconds
export const WORKER_CONCURRENCY = 5
export const WORKER_RETRY_LIMIT = 3

export const WORKER_SHUTDOWN_TIMEOUT = 30_000 // 30 seconds
export const scheduledPublishQueue = new Queue<ScheduledPublishJobData>(
  SCHEDULED_PUBLISH_QUEUE_NAME,
  {
    connection: RedisClient,
    defaultJobOptions: defaultOpts,
  },
)

/** Redlock settings */
export const LOCK_TTL = 30_000 // 30 seconds

/** Job settings to be used by the caller */
const BACKOFF: BackoffOptions = {
  type: "exponential",
  delay: 10_000, // 10s, then 20s, then 40s etc
}

export const getJobOptionsFromScheduledAt = (
  resourceId: string,
  scheduledAt: Date,
): JobsOptions => {
  const delayInMs = scheduledAt.getTime() - Date.now()
  return {
    attempts: WORKER_RETRY_LIMIT,
    backoff: BACKOFF,
    removeOnComplete: { age: REMOVE_ON_COMPLETE_BUFFER },
    removeOnFail: { age: REMOVE_ON_FAIL_BUFFER },
    delay: delayInMs,
    jobId: getJobIdFromResourceId(resourceId),
  }
}

export const getJobIdFromResourceId = (resourceId: string) =>
  `resource-${resourceId}`
