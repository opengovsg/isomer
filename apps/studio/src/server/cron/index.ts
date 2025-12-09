import { createBaseLogger } from "../../lib/logger"
import { deactivateInactiveUsersJob } from "./jobs/deactivateInactiveUsersJob"
import { schedulePublishingJob } from "./jobs/schedulePublishingJob"
import { sendAccountDeactivationWarningEmailsJob } from "./jobs/sendAccountDeactivationWarningEmailsJob"

const logger = createBaseLogger({ path: "cron:index" })

// Track cron job instances for proper cleanup
const cronJobs: { stop: () => void }[] = []

export const initializeCronJobs = async () => {
  logger.info("Initializing cron jobs...")

  // Initialize and track all cron jobs
  cronJobs.push(
    await deactivateInactiveUsersJob(),
    await schedulePublishingJob(),
    await sendAccountDeactivationWarningEmailsJob({ inHowManyDays: 1 }),
    await sendAccountDeactivationWarningEmailsJob({ inHowManyDays: 7 }),
    await sendAccountDeactivationWarningEmailsJob({ inHowManyDays: 14 }),
  )

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
