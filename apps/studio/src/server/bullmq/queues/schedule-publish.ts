import type { Job, JobsOptions } from "bullmq"
import type { Lock } from "redlock"
import { Queue, Worker } from "bullmq"
import { differenceInSeconds } from "date-fns"
import { ResourceLockedError } from "redlock"

import { RedisClient, RedlockClient } from "@isomer/redis"

import { sendFailedSchedulePublishEmail } from "~/features/mail/service"
import { createBaseLogger } from "~/lib/logger"
import { db } from "~/server/modules/database"
import {
  getPageById,
  publishPageResource,
  updatePageById,
} from "~/server/modules/resource/resource.service"
import { handleSignal } from "../utils"
import {
  BACKOFF,
  defaultOpts,
  LOCK_TTL,
  REDLOCK_SETTINGS,
  REMOVE_ON_COMPLETE_BUFFER,
  REMOVE_ON_FAIL_BUFFER,
  SCHEDULED_PUBLISH_QUEUE_NAME,
  WORKER_CONCURRENCY,
  WORKER_RETRY_LIMIT,
} from "./constants"

export interface ScheduledPublishJobData {
  resourceId: number // the id of the resource to be scheduled for publish
  siteId: number // the id of the site which the page belongs to
  userId: string // the id of the user who scheduled the publish
}

/** BullMQ Queue for scheduling publish jobs */
export const scheduledPublishQueue = new Queue<ScheduledPublishJobData>(
  SCHEDULED_PUBLISH_QUEUE_NAME,
  {
    connection: RedisClient,
    defaultJobOptions: defaultOpts,
  },
)

const logger = createBaseLogger({ path: "bullmq:schedule-publish" })
const BUFFER_IN_SECONDS = 60 // seconds buffer to allow for slight delays in job processing

/**
 * Get job options for a scheduled publish job
 * @param resourceId The id of the resource to be published
 * @param scheduledAt The date and time when the job is scheduled to run
 * @returns The job options for the scheduled publish job
 */
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

/**
 * Creates and returns a Worker that processes scheduled publish jobs
 * @returns A Worker that processes scheduled publish jobs
 */
export const createScheduledPublishWorker = () => {
  const worker = new Worker<ScheduledPublishJobData>(
    scheduledPublishQueue.name,
    async (job: Job<ScheduledPublishJobData>) => {
      await publishScheduledResource(job)
      return job.id
    },
    {
      connection: RedisClient,
      removeOnComplete: { age: REMOVE_ON_COMPLETE_BUFFER },
      removeOnFail: { age: REMOVE_ON_FAIL_BUFFER },
      concurrency: WORKER_CONCURRENCY,
    },
  )
  return worker
}

const publishScheduledResource = async ({
  id: jobId,
  data: { resourceId, siteId, userId },
  attemptsMade,
}: Job<ScheduledPublishJobData>) => {
  let lock: Lock | null = null
  try {
    // Acquire a lock for this resourceId to prevent concurrent processing
    lock = await RedlockClient.acquire(
      [`locks:resource:${resourceId}`],
      LOCK_TTL,
      REDLOCK_SETTINGS,
    )
    const page = await db.transaction().execute(async (tx) => {
      const page = await getPageById(tx, { resourceId, siteId })
      if (!page) {
        logger.error({
          message: `Page with id ${resourceId} not found or does not belong to site ${siteId}.`,
        })
        return null
      }
      if (!page.scheduledAt) {
        logger.info({
          message: `Page with id ${resourceId} is no longer scheduled for publishing. Exiting job.`,
        })
        return null
      }
      // Double-check that we're within the buffer time of the scheduledAt time
      // This is to prevent publishing if the job was significantly delayed (e.g. due to worker downtime)
      // We only do this check on the first attempt, as subsequent attempts are likely due to transient failures
      // and we don't want to block those from going through if the timing is slightly off
      if (
        attemptsMade === 0 && // only check on first attempt
        Math.abs(differenceInSeconds(page.scheduledAt, new Date())) >
          BUFFER_IN_SECONDS
      ) {
        logger.info({
          message: `Page with id ${resourceId} is scheduled for publishing outside the buffer time. Exiting job.`,
        })
        return null
      }
      // NOTE: once it's been claimed, we unset scheduledAt even if publish fails
      // The scheduledAt field currently blocks the editing flow so we want to
      // ensure it's unset even if publish fails, to avoid blocking the user from making further edits
      return await updatePageById(
        {
          id: resourceId,
          siteId,
          scheduledAt: null,
        },
        tx,
      )
    })
    // Publish the page outside of the transaction to avoid long-running transactions
    if (page) {
      logger.info({ message: `Publishing scheduled page ${resourceId}` })
      await publishPageResource({
        logger,
        siteId,
        resourceId: page.id,
        userId,
      })
    }
  } catch (err) {
    // If we fail to acquire the lock, it means another worker is processing this resource and we can exit gracefully
    if (err instanceof ResourceLockedError) {
      logger.info({
        message: `Failed to acquire lock for resource ${resourceId} as another worker is processing it. Exiting job ${jobId}.`,
        error: err,
      })
      return
    }
    throw err
  } finally {
    // Ensure the lock is released if it was acquired
    if (lock) {
      await lock.release().catch((err: Error) => {
        logger.warn({
          message: `Failed to release lock for resource ${resourceId}. Lock may have expired.`,
          error: err,
        })
      })
    }
  }
}

export const scheduledPublishWorker = createScheduledPublishWorker()

// Handle failed jobs
scheduledPublishWorker.on(
  "failed",
  (job: Job<ScheduledPublishJobData> | undefined, err: Error) => {
    void (async () => {
      if (!job) {
        logger.error({
          message: "Job is undefined in failed event",
          error: err,
        })
        return
      }
      const {
        data: { resourceId, userId },
      } = job
      // Log differently based on number of attempts made
      logger.error({
        message:
          job.attemptsMade >= WORKER_RETRY_LIMIT
            ? `Publish for page ${resourceId} has failed ${WORKER_RETRY_LIMIT} or more times`
            : `Attempt ${job.attemptsMade} for ${resourceId} - publish failure`,
        job,
        error: err,
      })
      try {
        // Send an email to the user to inform that the publish has failed >= WORKER_RETRY_LIMIT times
        if (job.attemptsMade >= WORKER_RETRY_LIMIT) {
          // Get the email of the user who scheduled the publish from the database
          // We do not pass this in the job data to avoid stale data if the user has been deleted/modified
          const user = await db
            .selectFrom("User")
            .where("id", "=", userId)
            .selectAll()
            .executeTakeFirstOrThrow()
          await sendFailedSchedulePublishEmail({ recipientEmail: user.email })
        }
      } catch (emailErr) {
        logger.error({
          message: `Failed to send failed schedule publish email to ${userId} for resource ${resourceId}`,
          error: emailErr,
        })
      }
    })()
  },
)

// Handle worker-level errors
scheduledPublishWorker.on("error", (err: Error) => {
  logger.error({
    message: "Error occurred in worker process",
    error: err,
  })
})

// Handle graceful shutdown
process.on("SIGINT", () =>
  handleSignal(scheduledPublishWorker, logger, "SIGINT"),
)
process.on("SIGTERM", () =>
  handleSignal(scheduledPublishWorker, logger, "SIGTERM"),
)
