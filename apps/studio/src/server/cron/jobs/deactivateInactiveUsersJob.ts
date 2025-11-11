import cron from "node-cron"

import { bulkDeactivateInactiveUsers } from "~/server/modules/user/inactiveUsers.service"
import { createBaseLogger } from "../../../lib/logger"

const logger = createBaseLogger({
  path: "cron:deactivateInactiveUsersJob",
})

export const deactivateInactiveUsersJob = () => {
  const task = cron.schedule(
    "0 0 * * *", // every day at 00:00 (midnight)
    () => {
      const runJob = async (): Promise<void> => {
        try {
          logger.info(
            {
              timestamp: new Date().toISOString(),
              jobName: `deactivateInactiveUsersJob`,
            },
            "Deactivate inactive users job started",
          )

          await bulkDeactivateInactiveUsers()

          logger.info(`deactivateInactiveUsersJob completed successfully`)
        } catch (error) {
          logger.error(
            {
              error: error instanceof Error ? error.message : String(error),
              stack: error instanceof Error ? error.stack : undefined,
            },
            `deactivateInactiveUsersJob failed`,
          )
        }
      }
      void runJob() // Fire and forget - we don't need to await this
    },
    {
      scheduled: false, // Don't start immediately
      timezone: "Asia/Singapore",
    },
  )

  // Start the job
  task.start()

  logger.info(`deactivateInactiveUsersJob scheduled to run daily at midnight`)

  return task
}
