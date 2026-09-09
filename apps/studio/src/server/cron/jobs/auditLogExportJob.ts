import { createBaseLogger } from "~/lib/logger"
import {
  processPendingAuditLogExportBatchEmails,
  processPendingAuditLogExports,
} from "~/server/modules/audit/auditLogExport.service"

import { registerPgbossJob } from "@isomer/pgboss"

const JOB_NAME = "audit-log-export"
const CRON_SCHEDULE = "* * * * *" // every minute

const logger = createBaseLogger({ path: "cron:auditLogExportJob" })

export const auditLogExportJobHandler = async () => {
  await processPendingAuditLogExports()
  // Retries any batch whose zip-build-and-email attempt died mid-flight —
  // see the doc comment on processPendingAuditLogExportBatchEmails for why
  // this needs its own sweep rather than piggybacking on the one above.
  await processPendingAuditLogExportBatchEmails()
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
