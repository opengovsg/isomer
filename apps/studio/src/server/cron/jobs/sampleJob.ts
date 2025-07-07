import cron from "node-cron"

import { createBaseLogger } from "../../../lib/logger"

const logger = createBaseLogger({
  path: "cron:sampleJob",
})

export const sampleJob = () => {
  const task = cron.schedule(
    "*/10 * * * * *", // every 10 seconds
    () => {
      const runJob = async (): Promise<void> => {
        try {
          logger.info("Sample job started", {
            timestamp: new Date().toISOString(),
            jobName: `sampleJob`,
          })

          console.log("oo oo wah wah")

          logger.info(`sampleJob completed successfully`)
        } catch (error) {
          logger.error(`sampleJob failed`, {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
          })
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

  logger.info(`sampleJob scheduled to run every 10 seconds`)

  return task
}
