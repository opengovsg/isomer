import type { Job } from "bullmq"
import type { Lock } from "redlock"
import { Worker } from "bullmq"
import { ResourceLockedError } from "redlock"

import { sendFailedSchedulePublishEmail } from "~/features/mail/service"
import { createBaseLogger } from "~/lib/logger"
import { db } from "~/server/modules/database"
import {
  getPageById,
  publishPageResource,
  updatePageById,
} from "~/server/modules/resource/resource.service"
import {
  LOCK_TTL,
  REMOVE_ON_COMPLETE_BUFFER,
  REMOVE_ON_FAIL_BUFFER,
  SCHEDULED_PUBLISH_QUEUE_NAME,
  WORKER_CONCURRENCY,
  WORKER_RETRY_LIMIT,
} from "."
import { handleSignal, RedisClient, redlockClient } from "../utils"

export interface ScheduledPublishJobData {
  resourceId: number // the id of the resource to be scheduled for publish
  siteId: number // the id of the site which the page belongs to
  userId: string // the id of the user who scheduled the publish
}

/**
 * Cronjob cleanup settings, indicates delay after the scheduledAt timestamp when the job
 * needs to be forcefully cleaned up (in minutes)
 */
export const SCHEDULED_AT_CRONJOB_CUTOFF_DELAY_MINUTES = 10

const logger = createBaseLogger({ path: "bullmq:schedule-publish" })

const worker = new Worker<ScheduledPublishJobData>(
  SCHEDULED_PUBLISH_QUEUE_NAME,
  async (job: Job<ScheduledPublishJobData>) => {
    await publishScheduledResource(job)
  },
  {
    connection: RedisClient,
    removeOnComplete: { age: REMOVE_ON_COMPLETE_BUFFER },
    removeOnFail: { age: REMOVE_ON_FAIL_BUFFER },
    concurrency: WORKER_CONCURRENCY,
  },
)

const publishScheduledResource = async ({
  data: { resourceId, siteId, userId },
}: Job<ScheduledPublishJobData>) => {
  let lock: Lock | null = null
  try {
    // Acquire a lock for this resourceId to prevent concurrent processing
    lock = await redlockClient.acquire(
      [`locks:resource:${resourceId}`],
      LOCK_TTL,
    )
    const page = await db.transaction().execute(async (tx) => {
      const page = await getPageById(tx, { resourceId, siteId })
      if (!page) return null
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
    // Proceed to publish the page
    await publishPageResource({
      logger,
      siteId,
      resourceId: page.id,
      userId,
    })
  } catch (err) {
    // If we fail to acquire the lock, it means another worker is processing this resource
    // We log this and exit gracefully
    if (err instanceof ResourceLockedError) {
      logger.info({
        message: `Failed to acquire lock for resource ${resourceId} as another worker is processing it.`,
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

// Handle failed jobs
worker.on(
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
worker.on("error", (err: Error) => {
  logger.error({
    message: "Error occurred in worker process",
    error: err,
  })
})

// Handle graceful shutdown
process.on("SIGINT", () => handleSignal(worker, logger, "SIGINT"))
process.on("SIGTERM", () => handleSignal(worker, logger, "SIGTERM"))
