import type { Job } from "bullmq"
import { Queue, Worker } from "bullmq"
import { differenceInSeconds } from "date-fns"

import { getRedisWithRedlock } from "@isomer/redis"

import { sendFailedPublishEmail } from "~/features/mail/service"
import {
  ENABLE_EMAILS_FOR_SCHEDULED_PUBLISHES_FEATURE_KEY,
  getIsScheduledPublishingEnabledForSite,
} from "~/lib/growthbook"
import { createBaseLogger } from "~/lib/logger"
import { createGrowthBookContext } from "~/server/context"
import { db } from "~/server/modules/database"
import { bulkValidateUserPermissionsForResources } from "~/server/modules/permissions/permissions.service"
import {
  getPageById,
  publishPageResource,
  updatePageById,
} from "~/server/modules/resource/resource.service"
import { getSiteNameAndCodeBuildId } from "~/server/modules/site/site.service"
import { handleSignal } from "../utils"
import {
  REMOVE_ON_COMPLETE_BUFFER,
  REMOVE_ON_FAIL_BUFFER,
  SCHEDULED_AT_TOLERANCE_SECONDS,
  SCHEDULED_PUBLISH_QUEUE_NAME,
  schedulePublishJobOpts,
  SITE_PUBLISH_BUFFER_SECONDS,
  WORKER_CONCURRENCY,
  WORKER_RETRY_LIMIT,
} from "./constants"
import { sitePublishQueue } from "./site-publish"
import { getJobOptionsFromScheduledAt, handleFailedJob } from "./utils"

export interface ScheduledPublishJobData {
  scheduledAt: string // the date and time when the resource is scheduled to be published, in ISO format
  resourceId: number // the id of the resource to be scheduled for publish
  siteId: number // the id of the site which the page belongs to
  userId: string // the id of the user who scheduled the publish
}

const { redis: RedisClient } = getRedisWithRedlock({
  bullmqCompatible: true,
})

/** BullMQ Queue for scheduling publish jobs */
export const scheduledPublishQueue = new Queue<ScheduledPublishJobData>(
  SCHEDULED_PUBLISH_QUEUE_NAME,
  {
    connection: RedisClient,
    defaultJobOptions: schedulePublishJobOpts,
  },
)

const logger = createBaseLogger({ path: "bullmq:schedule-publish" })

/**
 * Creates and returns a Worker that processes scheduled publish jobs
 * @returns A Worker that processes scheduled publish jobs
 */
export const createScheduledPublishWorker = () => {
  const worker = new Worker<ScheduledPublishJobData>(
    scheduledPublishQueue.name,
    async (job: Job<ScheduledPublishJobData>) => {
      await publishScheduledResource(job.id, job.data, job.attemptsMade)
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

export const publishScheduledResource = async (
  jobId: string | undefined,
  { resourceId, siteId, userId, scheduledAt }: ScheduledPublishJobData,
  attemptsMade: number,
) => {
  // verify user still has permission to publish on the site
  await bulkValidateUserPermissionsForResources({
    siteId,
    userId,
    action: "publish",
  })
  const page = await db.transaction().execute(async (tx) => {
    const page = await getPageById(tx, { resourceId, siteId })
    if (!page) {
      logger.error(
        { resourceId, siteId, jobId, userId },
        `Page with id ${resourceId} not found or does not belong to site ${siteId}. Exiting job.`,
      )
      return null
    }
    // If multiple attempts have been made, we skip the scheduledAt time checks since the scheduledAt
    // may have been cleared on the first attempt
    if (attemptsMade === 0) {
      if (!page.scheduledAt) {
        logger.info(
          { resourceId, jobId, userId },
          `Page with id ${resourceId} is no longer scheduled for publishing. Exiting job.`,
        )
        return null
      }
      // Double-check that we're within the buffer time of the scheduledAt time
      // This is to prevent publishing if the job was significantly delayed (e.g. due to worker downtime)
      // We only do this check on the first attempt, as subsequent attempts are likely due to transient failures
      // and we don't want to block those from going through if the timing is slightly off
      if (
        Math.abs(differenceInSeconds(page.scheduledAt, new Date())) >
        SCHEDULED_AT_TOLERANCE_SECONDS
      ) {
        logger.error(
          { resourceId, jobId, userId },
          `Page with id ${resourceId} is scheduled for publishing outside the buffer time. Exiting job.`,
        )
        return null
      }
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
  // No page found or not scheduled, exit (logging handled above)
  if (!page) return
  // Publish the page outside of the transaction to avoid long-running transactions
  logger.info(
    { resourceId, jobId, userId },
    `Publishing scheduled page ${resourceId}`,
  )
  // Get the user who scheduled the publish from the database
  const user = await db
    .selectFrom("User")
    .where("id", "=", userId)
    .selectAll()
    .executeTakeFirst()
  // if the user no longer exists, we log an error and exit, since we don't have a user to attribute the publish to
  if (!user) {
    logger.error(
      { resourceId, jobId, userId },
      `User with id ${userId} not found. Cannot continue with publish of resource ${resourceId}.`,
    )
    return
  }
  // publish the page, without starting a site publish yet
  await publishPageResource({
    logger,
    siteId,
    resourceId: page.id,
    user,
    isScheduled: true,
    startSitePublish: false,
    addCodebuildJobRow: await getIsScheduledPublishingEnabledForSite({
      siteId,
    }),
  })
  // if the page publish succeeds and a codebuild project is provided,
  // we add a job to the site publish queue to kick off the site build
  const { codeBuildId } = await getSiteNameAndCodeBuildId(siteId)
  if (!codeBuildId) {
    // If there's no CodeBuild project associated with the site, we skip scheduling a site publish job since there's nothing to build
    logger.info(
      { siteId },
      "No CodeBuild project ID has been configured for the site, skipping site publish",
    )
    return
  }
  await sitePublishQueue.add(
    "site-publish",
    { siteId },
    getJobOptionsFromScheduledAt(
      siteId.toString(),
      new Date(scheduledAt),
      // add a slight delay for site publish to allow for any eventual consistency issues
      SITE_PUBLISH_BUFFER_SECONDS * 1000,
    ),
  )
}

export const scheduledPublishWorker = createScheduledPublishWorker()

// Handle failed jobs
scheduledPublishWorker.on(
  "failed",
  (job: Job<ScheduledPublishJobData> | undefined, err: Error) => {
    void handleFailedJob(job, logger, err, {
      workerName: "ScheduledPublishWorker",
      retryLimit: WORKER_RETRY_LIMIT,
      onFinalFailure: async ({
        data: { userId, resourceId, siteId },
      }: Job<ScheduledPublishJobData>) => {
        // Get the email of the user who scheduled the publish from the database
        const { email } = await db
          .selectFrom("User")
          .where("id", "=", userId)
          .select("User.email")
          .executeTakeFirstOrThrow()

        // check the growthbook feature flag to see if we should send emails for scheduled publishes
        const gb = await createGrowthBookContext()
        if (gb.isOn(ENABLE_EMAILS_FOR_SCHEDULED_PUBLISHES_FEATURE_KEY)) {
          // get the resource that was being published
          const resource = await getPageById(db, {
            resourceId,
            siteId,
          })
          if (!resource) throw new Error("The resource no longer exists")
          await sendFailedPublishEmail({
            recipientEmail: email,
            isScheduled: true,
            resource,
          })
        }
      },
    })
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
