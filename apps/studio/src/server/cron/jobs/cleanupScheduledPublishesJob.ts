import { subMinutes } from "date-fns"
import cron from "node-cron"

import { createBaseLogger } from "~/lib/logger"
import { db } from "~/server/modules/database"

const logger = createBaseLogger({
  path: "cron:cleanupScheduledPublishes",
})

/**
 * Cronjob cleanup settings, indicates delay after the scheduledAt timestamp when the job
 * needs to be forcefully cleaned up (in minutes)
 */
const SCHEDULED_AT_CRONJOB_CUTOFF_DELAY_MINUTES = 10

export const cleanupScheduledPublishesJob = () => {
  // Run every 10 minutes to clean up jobs which are stuck in "active" state for more than CUTOFF_TIME_MINUTES
  const task = cron.schedule(
    "*/10 * * * *",
    () => {
      void (async () => {
        const cutoff = subMinutes(
          new Date(),
          SCHEDULED_AT_CRONJOB_CUTOFF_DELAY_MINUTES,
        )
        try {
          const scheduledButNotClearedResources = await db
            .selectFrom("Resource")
            .where("scheduledAt", "<", cutoff)
            .selectAll()
            .execute()
          if (scheduledButNotClearedResources.length) {
            logger.warn(
              `Cleaned up ${scheduledButNotClearedResources.length} stuck scheduled pages older than 10 minutes`,
              {
                jobs: scheduledButNotClearedResources.map((r) => ({
                  resourceId: r.id,
                  scheduledAt: r.scheduledAt,
                })),
              },
            )
          }
          // Clear scheduledAt for these resources, so the frontend editing is not blocked
          await db
            .updateTable("Resource")
            .set({ scheduledAt: null })
            .where(
              "id",
              "in",
              scheduledButNotClearedResources.map((r) => r.id),
            )
            .execute()
        } catch (err) {
          logger.error({ err }, "Error while cleaning up scheduledAt")
        }
      })()
    },
    {
      scheduled: false, // Don't start immediately
      timezone: "Asia/Singapore",
    },
  )
  task.start()
  logger.info(`cleanupScheduledPublishesJob scheduled to run every 10 minutes`)
  return task
}
