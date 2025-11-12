import type { Job } from "bullmq"
import { Queue, Worker } from "bullmq"

import { getRedisWithRedlock } from "@isomer/redis"

import { createBaseLogger } from "~/lib/logger"
import { createGrowthBookContext } from "~/server/context"
import { publishSite } from "~/server/modules/aws/codebuild.service"
import { updateCodebuildStatusAndSendEmails } from "~/server/modules/webhook/webhook.utils"
import { handleSignal } from "../utils"
import {
  REMOVE_ON_COMPLETE_BUFFER,
  REMOVE_ON_FAIL_BUFFER,
  SITE_PUBLISH_QUEUE_NAME,
  sitePublishJobOpts,
  WORKER_CONCURRENCY,
  WORKER_RETRY_LIMIT,
} from "./constants"
import { handleFailedJob } from "./utils"

export interface SitePublishJobData {
  siteId: number // the siteId of the site to be published
}

const { redis: RedisClient } = getRedisWithRedlock({
  bullmqCompatible: true,
})

/** BullMQ Queue for site publish jobs */
export const sitePublishQueue = new Queue<SitePublishJobData>(
  SITE_PUBLISH_QUEUE_NAME,
  {
    connection: RedisClient,
    defaultJobOptions: sitePublishJobOpts,
  },
)

const logger = createBaseLogger({ path: "bullmq:site-publish" })

/**
 * Creates and returns a Worker that processes scheduled publish jobs
 * @returns A Worker that processes scheduled publish jobs
 */
export const createSitePublishWorker = () => {
  const worker = new Worker<SitePublishJobData>(
    sitePublishQueue.name,
    async (job: Job<SitePublishJobData>) => {
      logger.info(
        { jobId: job.id, siteId: job.data.siteId },
        `Publishing all resources for site ${job.data.siteId}`,
      )
      await publishSite(logger, job.data.siteId)
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

export const sitePublishWorker = createSitePublishWorker()

// Handle failed jobs
sitePublishWorker.on(
  "failed",
  (job: Job<SitePublishJobData> | undefined, err: Error) => {
    void handleFailedJob(job, logger, err, {
      workerName: "SitePublishWorker",
      retryLimit: WORKER_RETRY_LIMIT,
      onFinalFailure: async ({ data: { siteId } }: Job<SitePublishJobData>) => {
        const gb = await createGrowthBookContext()
        await updateCodebuildStatusAndSendEmails(
          logger,
          gb,
          null,
          siteId,
          "FAILED",
        )
      },
    })
  },
)

// Handle worker-level errors
sitePublishWorker.on("error", (err: Error) => {
  logger.error({
    message: "Error occurred in worker process",
    error: err,
  })
})

// Handle graceful shutdown
process.on("SIGINT", () => handleSignal(sitePublishWorker, logger, "SIGINT"))
process.on("SIGTERM", () => handleSignal(sitePublishWorker, logger, "SIGTERM"))
