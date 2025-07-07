import { createBaseLogger } from "../../lib/logger"
import {
  deactivateInactiveUsersJob,
  sendAccountDeactivationDayEmailJob,
} from "./jobs"

const logger = createBaseLogger({ path: "cron:index" })

export const initializeCronJobs = () => {
  logger.info("Initializing cron jobs...")

  sendAccountDeactivationDayEmailJob({ inHowManyDays: 1 })
  sendAccountDeactivationDayEmailJob({ inHowManyDays: 7 })
  sendAccountDeactivationDayEmailJob({ inHowManyDays: 14 })
  deactivateInactiveUsersJob()

  logger.info("Cron jobs initialized successfully")
}

export const stopCronJobs = () => {
  logger.info("Stopping all cron jobs...")
  // node-cron doesn't have a global stop method, so we need to track jobs individually
  sendAccountDeactivationDayEmailJob({ inHowManyDays: 1 })
  sendAccountDeactivationDayEmailJob({ inHowManyDays: 7 })
  sendAccountDeactivationDayEmailJob({ inHowManyDays: 14 })
  deactivateInactiveUsersJob()

  logger.info("Cron jobs stopped")
}
