import { createBaseLogger } from "../../lib/logger"
import {
  deactivateInactiveUsersJob,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  sendAccountDeactivationDayEmailJob,
} from "./jobs"

const logger = createBaseLogger({ path: "cron:index" })

// Track cron job instances for proper cleanup
const cronJobs: { stop: () => void }[] = []

export const initializeCronJobs = () => {
  logger.info("Initializing cron jobs...")

  // Initialize and track all cron jobs
  cronJobs.push(
    // TODO: Uncomment when we have a proper scheduler that prevents idempotency issues
    // sendAccountDeactivationDayEmailJob({ inHowManyDays: 1 }),
    // sendAccountDeactivationDayEmailJob({ inHowManyDays: 7 }),
    // sendAccountDeactivationDayEmailJob({ inHowManyDays: 14 }),
    deactivateInactiveUsersJob(),
  )

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
