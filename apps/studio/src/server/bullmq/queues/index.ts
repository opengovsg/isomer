import type { BackoffOptions } from "bullmq"
import { Queue } from "bullmq"

import { defaultOpts, RedisClient } from "../utils"

/**
 * Queue and job settings
 */
export const SCHEDULED_PUBLISH_QUEUE_NAME = "scheduled-publish-queue"
export const REMOVE_ON_COMPLETE_BUFFER = 60 * 60 * 24 // 1 day in seconds
export const REMOVE_ON_FAIL_BUFFER = 60 * 60 * 24 * 4 // 4 days in seconds
export const WORKER_CONCURRENCY = 5
export const BACKOFF: BackoffOptions = {
  type: "exponential",
  delay: 10_000, // 10s, then 20s, then 40s etc
}
export const WORKER_SHUTDOWN_TIMEOUT = 30_000 // 30 seconds
export const scheduledPublishQueue = new Queue(SCHEDULED_PUBLISH_QUEUE_NAME, {
  connection: RedisClient,
  defaultJobOptions: defaultOpts,
})

/** Redlock settings */
export const LOCK_TTL = 30_000 // 30 seconds
