import { registerPgbossJob } from "@isomer/pgboss"

import { env } from "~/env.mjs"
import { bulkSendAccountDeactivationWarningEmails } from "~/server/modules/user/inactiveUsers.service"
import { createBaseLogger } from "../../../lib/logger"

const JOB_NAME = "send-account-deactivation-warning-emails"
const CRON_SCHEDULE = "0 0 * * *" // every day at 00:00 (midnight)

const logger = createBaseLogger({
  path: "cron:sendAccountDeactivationWarningEmailsJob",
})

export const sendAccountDeactivationWarningEmailsJob = async () => {
  return await registerPgbossJob(
    logger,
    JOB_NAME,
    CRON_SCHEDULE,
    sendAccountDeactivationWarningEmailsJobHandler,
    { retryLimit: 2, singletonKey: JOB_NAME },
    env.SEND_ACCOUNT_DEACTIVATION_WARNING_EMAILS_HEARTBEAT_URL
      ? {
          heartbeatURL:
            env.SEND_ACCOUNT_DEACTIVATION_WARNING_EMAILS_HEARTBEAT_URL,
        }
      : undefined,
  )
}

const sendAccountDeactivationWarningEmailsJobHandler = async () => {
  try {
    logger.info(
      {
        timestamp: new Date().toISOString(),
        jobName: `sendAccountDeactivationWarningEmailsJob`,
      },
      "Send account deactivation warning emails job started",
    )

    await bulkSendAccountDeactivationWarningEmails({
      inHowManyDays: 1,
    })

    logger.info(
      `sendAccountDeactivationWarningEmailsJob completed successfully`,
    )
  } catch (error) {
    logger.error(
      {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      `sendAccountDeactivationWarningEmailsJob failed`,
    )
  }
}
