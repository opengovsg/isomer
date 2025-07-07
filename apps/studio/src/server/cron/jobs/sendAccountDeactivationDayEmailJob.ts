import cron from "node-cron"

import type { AccountDeactivationWarningEmailTemplateData } from "~/features/mail/templates/types"
import { createBaseLogger } from "../../../lib/logger"

const logger = createBaseLogger({
  path: "cron:sendAccountDeactivationDayEmailJob",
})

export type SendAccountDeactivationDayEmailJobProps = Pick<
  AccountDeactivationWarningEmailTemplateData,
  "inHowManyDays"
>

export const sendAccountDeactivationDayEmailJob = ({
  inHowManyDays,
}: SendAccountDeactivationDayEmailJobProps) => {
  const task = cron.schedule(
    "0 0 * * *", // every day at 00:00 (midnight)
    () => {
      try {
        logger.info("Account deactivation email job started", {
          timestamp: new Date().toISOString(),
          jobName: `sendAccountDeactivationDayEmailJob (${inHowManyDays} days)`,
        })

        // TODO: Implement account deactivation email logic

        logger.info(
          `sendAccountDeactivationDayEmailJob (${inHowManyDays} days) completed successfully`,
        )
      } catch (error) {
        logger.error(
          `sendAccountDeactivationDayEmailJob (${inHowManyDays} days) failed`,
          {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
          },
        )
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
    `sendAccountDeactivationDayEmailJob (${inHowManyDays} days) scheduled to run daily at midnight`,
  )

  return task
}
