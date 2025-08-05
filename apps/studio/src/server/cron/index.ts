import { env } from "~/env.mjs"
import { createBaseLogger } from "../../lib/logger"
import { deactivateInactiveUsersJob } from "./jobs"

const logger = createBaseLogger({ path: "cron:index" })

// Track cron job instances for proper cleanup
const cronJobs: { stop: () => void }[] = []

export const initializeCronJobs = () => {
  logger.info("Initializing cron jobs...")

  // Initialize and track all cron jobs
  if (env.NEXT_PUBLIC_APP_ENV === "production") {
    // NOTE: We only remove inactive users in production as UAT and staging
    // environments are free for users to play around with for an indefinite
    // period of time
    cronJobs.push(deactivateInactiveUsersJob())
  }

  logger.info("Cron jobs initialized successfully")
}

export const stopCronJobs = () => {
  logger.info("Stopping all cron jobs...")

  // Stop all tracked cron jobs
  cronJobs.forEach((job) => {
    try {
      job.stop()
    } catch (error) {
      logger.error("Error stopping cron job", { error })
    }
  })

  // Clear the array
  cronJobs.length = 0

  logger.info("Cron jobs stopped")
}
