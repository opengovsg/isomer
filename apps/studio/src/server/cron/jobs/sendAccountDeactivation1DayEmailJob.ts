import cron from "node-cron"

import { createBaseLogger } from "../../../lib/logger"

const logger = createBaseLogger({
  path: "cron:sendAccountDeactivation1DayEmailJob",
})

export const sendAccountDeactivation1DayEmailJob = () => {
  const task = cron.schedule(
    "0 0 * * *", // every day at 00:00 (midnight)
    () => {
      try {
        logger.info("Account deactivation email job started", {
          timestamp: new Date().toISOString(),
          jobName: "sendAccountDeactivation1DayEmailJob",
        })

        // TODO: Implement account deactivation email logic

        logger.info(
          "sendAccountDeactivation1DayEmailJob completed successfully",
        )
      } catch (error) {
        logger.error("sendAccountDeactivation1DayEmailJob failed", {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        })
      }
    },
    {
      scheduled: false, // Don't start immediately
      timezone: "Asia/Singapore",
    },
  )

  // Start the job
  task.start()

  logger.info(
    "sendAccountDeactivation1DayEmailJob scheduled to run daily at midnight",
  )

  return task
}
