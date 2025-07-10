import cron from "node-cron"

import type { BulkSendAccountDeactivationWarningEmailsProps } from "~/server/modules/user/inactiveUsers.service"
import { bulkSendAccountDeactivationWarningEmails } from "~/server/modules/user/inactiveUsers.service"
import { createBaseLogger } from "../../../lib/logger"

const logger = createBaseLogger({
  path: "cron:sendAccountDeactivationDayEmailJob",
})

export type SendAccountDeactivationDayEmailJobProps = Pick<
  BulkSendAccountDeactivationWarningEmailsProps,
  "inHowManyDays"
>

export const sendAccountDeactivationDayEmailJob = ({
  inHowManyDays,
}: SendAccountDeactivationDayEmailJobProps) => {
  const task = cron.schedule(
    "0 0 * * *", // every day at 00:00 (midnight)
    () => {
      const runJob = async (): Promise<void> => {
        try {
          logger.info("Account deactivation email job started", {
            timestamp: new Date().toISOString(),
            jobName: `sendAccountDeactivationDayEmailJob (${inHowManyDays} days)`,
          })

          // TODO: Implement account deactivation email logic
          await bulkSendAccountDeactivationWarningEmails({ inHowManyDays })

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

  logger.info(
    `sendAccountDeactivationDayEmailJob (${inHowManyDays} days) scheduled to run daily at midnight`,
  )

  return task
}
