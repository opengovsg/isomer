import { registerPgbossJob } from "@isomer/pgboss"

import type { BulkSendAccountDeactivationWarningEmailsProps } from "~/server/modules/user/types"
import { bulkSendAccountDeactivationWarningEmails } from "~/server/modules/user/inactiveUsers.service"
import { createBaseLogger } from "../../../lib/logger"

const CRON_SCHEDULE = "0 0 * * *" // every day at 00:00 (midnight)

const logger = createBaseLogger({
  path: "cron:sendAccountDeactivationWarningEmailsJob",
})

export const sendAccountDeactivationWarningEmailsJob = async ({
  inHowManyDays,
}: BulkSendAccountDeactivationWarningEmailsProps) => {
  // Include inHowManyDays in the job name to make each registration unique
  const JOB_NAME = `send-account-deactivation-warning-emails-${inHowManyDays}days`
  return await registerPgbossJob(
    logger,
    JOB_NAME,
    CRON_SCHEDULE,
    () => bulkSendAccountDeactivationWarningEmails({ inHowManyDays }),
    // It's sent on best-effort basis, so don't retry failed jobs or heartbeat monitoring
    { retryLimit: 0, singletonKey: JOB_NAME },
  )
}
