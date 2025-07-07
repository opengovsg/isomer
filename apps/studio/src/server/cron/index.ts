import { createBaseLogger } from "../../lib/logger"
import { sendAccountDeactivation1DayEmailJob } from "./jobs"

const logger = createBaseLogger({ path: "cron:index" })

export const initializeCronJobs = () => {
  logger.info("Initializing cron jobs...")

  sendAccountDeactivation1DayEmailJob()

  logger.info("Cron jobs initialized successfully")
}

export const stopCronJobs = () => {
  logger.info("Stopping all cron jobs...")
  // node-cron doesn't have a global stop method, so we need to track jobs individually
  // This is a placeholder for future implementation
  logger.info("Cron jobs stopped")
}
