import type { SendAccountDeactivationDayEmailJobProps } from "./jobs/sendAccountDeactivationDayEmailJob"
import { createBaseLogger } from "../../lib/logger"
import {
  deactivateInactiveUsersJob,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  sendAccountDeactivationDayEmailJob,
} from "./jobs"

const logger = createBaseLogger({ path: "cron:index" })

export const initializeCronJobs = () => {
  logger.info("Initializing cron jobs...")

  const availableDays: SendAccountDeactivationDayEmailJobProps["inHowManyDays"][] =
    [1, 7, 14]
  availableDays.forEach((_inHowManyDays) => {
    // Commented out until we implement proper scheduler that prevents idempotency issues
    // sendAccountDeactivationDayEmailJob({ inHowManyDays })
  })

  deactivateInactiveUsersJob()

  logger.info("Cron jobs initialized successfully")
}

export const stopCronJobs = () => {
  logger.info("Stopping all cron jobs...")
  // node-cron doesn't have a global stop method, so we need to track jobs individually
  // This is a placeholder for future implementation
  logger.info("Cron jobs stopped")
}
