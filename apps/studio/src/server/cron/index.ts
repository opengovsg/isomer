import { createBaseLogger } from "../../lib/logger"
import { deactivateInactiveUsersJob } from "./jobs"
import { schedulePublishingJob } from "./jobs/schedulePublishingJob"

const logger = createBaseLogger({ path: "cron:index" })

// Track cron job instances for proper cleanup
const cronJobs: { stop: () => void }[] = []

export const initializeCronJobs = async () => {
  logger.info("Initializing cron jobs...")

  // Initialize and track all cron jobs
  cronJobs.push(deactivateInactiveUsersJob(), await schedulePublishingJob())

  logger.info("Cron jobs initialized successfully")
}

export const stopCronJobs = () => {
  logger.info("Stopping all cron jobs...")

  // Stop all tracked cron jobs
  cronJobs.forEach((job) => {
    try {
      job.stop()
    } catch (error: unknown) {
      logger.error({ error }, "Error stopping cron job")
    }
  })

  // Clear the array
  cronJobs.length = 0

  logger.info("Cron jobs stopped")
}
