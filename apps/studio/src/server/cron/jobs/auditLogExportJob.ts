import { createBaseLogger } from "~/lib/logger"
import { processPendingAuditLogExports } from "~/server/modules/audit/auditLogExport.service"

import { registerPgbossJob } from "@isomer/pgboss"

const JOB_NAME = "audit-log-export"
const CRON_SCHEDULE = "* * * * *" // every minute

const logger = createBaseLogger({ path: "cron:auditLogExportJob" })

export const auditLogExportJobHandler = async () => {
  await processPendingAuditLogExports()
}

export const auditLogExportJob = async () => {
  return await registerPgbossJob(
    logger,
    JOB_NAME,
    CRON_SCHEDULE,
    auditLogExportJobHandler,
    { retryLimit: 3, singletonKey: JOB_NAME },
  )
}
