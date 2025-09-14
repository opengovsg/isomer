import type { BackoffOptions, JobsOptions } from "bullmq"
import type { Settings } from "redlock"
import { Queue } from "bullmq"

import { RedisClient } from "@isomer/redis"

import type { ScheduledPublishJobData } from "./schedule-publish"

/** Queue & worker settings */
export const SCHEDULED_PUBLISH_QUEUE_NAME = "scheduled-publish-queue"
export const REMOVE_ON_COMPLETE_BUFFER = 60 * 60 * 24 // 1 day in seconds
export const REMOVE_ON_FAIL_BUFFER = 60 * 60 * 24 * 4 // 4 days in seconds
export const WORKER_CONCURRENCY = 5
export const WORKER_RETRY_LIMIT = 3
export const WORKER_SHUTDOWN_TIMEOUT = 30_000 // 30 seconds
export const BACKOFF: BackoffOptions = {
  type: "exponential",
  delay: 10_000, // 10s, then 20s, then 40s etc
}

const defaultOpts: JobsOptions = {
  removeOnComplete: true,
  failParentOnFailure: true,
  attempts: WORKER_RETRY_LIMIT,
  backoff: BACKOFF,
}

/** BullMQ Queue for scheduling publish jobs */
export const scheduledPublishQueue = new Queue<ScheduledPublishJobData>(
  SCHEDULED_PUBLISH_QUEUE_NAME,
  {
    connection: RedisClient,
    defaultJobOptions: defaultOpts,
  },
)

/** Redlock settings */
export const LOCK_TTL = 30_000 // 30 seconds
export const REDLOCK_SETTINGS: Partial<Settings> = {
  retryCount: 0,
  retryDelay: 0,
  retryJitter: 0,
}
