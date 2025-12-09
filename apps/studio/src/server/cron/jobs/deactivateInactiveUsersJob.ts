import { registerPgbossJob } from "@isomer/pgboss"

import { env } from "~/env.mjs"
import { bulkDeactivateInactiveUsers } from "~/server/modules/user/inactiveUsers.service"
import { createBaseLogger } from "../../../lib/logger"

const JOB_NAME = "deactivate-inactive-users"
const CRON_SCHEDULE = "0 0 * * *" // every day at 00:00 (midnight)

const logger = createBaseLogger({
  path: "cron:deactivateInactiveUsersJob",
})

export const deactivateInactiveUsersJob = async () => {
  return await registerPgbossJob(
    logger,
    JOB_NAME,
    CRON_SCHEDULE,
    deactivateInactiveUsersJobHandler,
    { retryLimit: 2, singletonKey: JOB_NAME },
    env.DEACTIVATE_INACTIVE_USERS_HEARTBEAT_URL
      ? { heartbeatURL: env.DEACTIVATE_INACTIVE_USERS_HEARTBEAT_URL }
      : undefined,
  )
}

const deactivateInactiveUsersJobHandler = async () => {
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
