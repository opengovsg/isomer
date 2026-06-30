import { TRPCError } from "@trpc/server"
import { isAfter, isBefore, isSameMonth, parseISO } from "date-fns"
import { formatInTimeZone } from "date-fns-tz"
import {
  sendAuditLogExportFailedEmail,
  sendAuditLogExportReadyEmail,
} from "~/features/mail/service"
import { createBaseLogger } from "~/lib/logger"
import {
  AUDIT_LOG_EXPORT_URL_EXPIRY_SECONDS,
  generateSignedGetUrl,
  getAuditLogExportBucketName,
  uploadAuditLogExport,
} from "~/lib/s3"
import {
  type CreateAuditLogExportRequestInput,
  getCurrentSingaporeMonth,
  getEarliestExportableMonth,
} from "~/schemas/audit"

import type { BaseLogger } from "@isomer/logging"

import { db } from "../database"
import { validatePermissionsForManagingUsers } from "../permissions/permissions.service"
import {
  getAccessReportRows,
  getActivityReportRows,
  toCsv,
} from "./auditLogExport.query"

type CreateAuditLogExportRequestProps = CreateAuditLogExportRequestInput & {
  userId: string
}

// Statuses that represent an export that is still in-flight; a duplicate
// request for the same (site, user, month, report type) should be rejected
// while one of these exists.
const IN_FLIGHT_STATUSES = ["Pending", "Processing"] as const

export const createAuditLogExportRequest = async ({
  siteId,
  userId,
  month,
  reportType,
}: CreateAuditLogExportRequestProps) => {
  // Permission check FIRST, before any mutation. Audit log export is a
  // Site Admin-only capability — we reuse the same admin-only gate as the
  // user-management surface (`manage` on `UserManagement`), which only grants
  // the `manage` action to the `Admin` role. Editors/Publishers can `read`
  // but not `manage`, so they are rejected here with FORBIDDEN.
  await validatePermissionsForManagingUsers({
    siteId,
    userId,
    action: "manage",
  })

  // Reject months outside the allowed window (in Singapore time). This mirrors
  // the schema's window refinements as defense-in-depth, and uses the same
  // date-fns comparators (parseISO + isBefore/isAfter/isSameMonth) so the
  // comparison style stays consistent with schemas/audit.ts.
  const currentMonth = getCurrentSingaporeMonth()
  const requestedMonthDate = parseISO(`${month}-01`)
  const currentMonthDate = parseISO(`${currentMonth}-01`)
  if (
    !isSameMonth(requestedMonthDate, currentMonthDate) &&
    isAfter(requestedMonthDate, currentMonthDate)
  ) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "You cannot export audit logs for a month that is in the future",
    })
  }

  const earliestMonthDate = parseISO(
    `${getEarliestExportableMonth(currentMonth)}-01`,
  )
  if (
    !isSameMonth(requestedMonthDate, earliestMonthDate) &&
    isBefore(requestedMonthDate, earliestMonthDate)
  ) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "You can only export audit logs from the past 12 months",
    })
  }

  return db.transaction().execute(async (tx) => {
    // In-flight dedupe: if an export for the same site/user/month/report type
    // is already Pending or Processing, do not enqueue a second one.
    const existing = await tx
      .selectFrom("AuditLogExportRequest")
      .where("siteId", "=", siteId)
      .where("userId", "=", userId)
      .where("month", "=", month)
      .where("reportType", "=", reportType)
      .where("status", "in", IN_FLIGHT_STATUSES)
      .select("id")
      .executeTakeFirst()

    if (existing) {
      throw new TRPCError({
        code: "CONFLICT",
        message:
          "An export for this month and report type is already being generated",
      })
    }

    return tx
      .insertInto("AuditLogExportRequest")
      .values({
        siteId,
        userId,
        month,
        reportType,
        status: "Pending",
        attempts: 0,
      })
      .returningAll()
      .executeTakeFirstOrThrow()
  })
}

// ---------------------------------------------------------------------------
// Fulfilment orchestrator (LAYER 4c)
// ---------------------------------------------------------------------------

const logger: BaseLogger = createBaseLogger({
  path: "modules/audit/auditLogExport.service",
})

// After this many failed attempts a request is marked Failed (and the
// requester is emailed) rather than retried again on the next sweep.
const MAX_ATTEMPTS = 3

// Number of Pending requests claimed per cron sweep. Keeps each minute's run
// bounded so one large backlog cannot monopolise the worker.
const BATCH_SIZE = 20

// The reports to generate for each `reportType`. `Both` produces both files
// (and therefore both download links) in a single email.
const REPORTS_BY_TYPE = {
  Access: [{ kind: "Access", label: "Access report" }],
  Activity: [{ kind: "Activity", label: "Activity report" }],
  Both: [
    { kind: "Access", label: "Access report" },
    { kind: "Activity", label: "Activity report" },
  ],
} as const

/**
 * Render a `yyyy-MM` month string as a human-readable `MMMM yyyy` label (e.g.
 * "2026-06" → "June 2026") for the email body/subject. The month is already a
 * Singapore-time calendar month, so we format it as a plain UTC date to avoid
 * any zone shifting the displayed month.
 */
const toHumanReadableMonth = (month: string): string => {
  const [year, monthIndex] = month.split("-").map(Number)
  if (
    year === undefined ||
    monthIndex === undefined ||
    Number.isNaN(year) ||
    Number.isNaN(monthIndex)
  ) {
    // Fall back to the raw value rather than throwing — the export already
    // succeeded by the time we format the email.
    return month
  }
  // The month value is zone-agnostic; anchor it to a UTC instant and format in
  // UTC so the displayed month never shifts with the runtime's local zone.
  return formatInTimeZone(
    new Date(Date.UTC(year, monthIndex - 1, 1)),
    "UTC",
    "MMMM yyyy",
  )
}

/**
 * Process a single export request, identified by id.
 *
 * Step 1 claims the row atomically (Pending → Processing) so that concurrent
 * sweeps never double-process it. Steps 2–6 (load site/user, generate CSVs,
 * upload to S3, sign URLs, send the ready email, mark Done) are wrapped in a
 * try/catch: on any failure we increment `attempts` and either re-queue the
 * row (Pending) for the next sweep or, once `attempts >= MAX_ATTEMPTS`, mark it
 * Failed and best-effort email the requester. Raw errors are only ever logged,
 * never surfaced to the recipient.
 */
export const processAuditLogExportRequest = async (
  requestId: string,
): Promise<void> => {
  // Step 1: atomic claim. Only one sweep can flip Pending → Processing.
  const request = await db
    .updateTable("AuditLogExportRequest")
    .set({ status: "Processing", updatedAt: new Date() })
    .where("id", "=", requestId)
    .where("status", "=", "Pending")
    .returningAll()
    .executeTakeFirst()

  if (!request) {
    // Another sweep claimed it (or it is no longer Pending) — skip silently.
    return
  }

  try {
    // Step 2: load the site (for a display name) and the requesting user
    // (for the recipient email).
    const site = await db
      .selectFrom("Site")
      .where("id", "=", request.siteId)
      .select(["id", "name", "config"])
      .executeTakeFirstOrThrow()

    const user = await db
      .selectFrom("User")
      .where("id", "=", request.userId)
      .select(["id", "email"])
      .executeTakeFirstOrThrow()

    const siteConfig = site.config as { siteName?: string } | null
    const siteName = siteConfig?.siteName || site.name
    const recipientEmail = user.email

    // Step 3 + 4: for each report, run the query, serialise to CSV (always —
    // header-only CSV for zero rows), upload, and sign a download URL.
    const reports = REPORTS_BY_TYPE[request.reportType]
    const bucket = getAuditLogExportBucketName()

    const objectKeys: string[] = []
    const links: { label: string; url: string }[] = []

    for (const report of reports) {
      const rows =
        report.kind === "Access"
          ? await getAccessReportRows({
              siteId: request.siteId,
              month: request.month,
            })
          : await getActivityReportRows({
              siteId: request.siteId,
              month: request.month,
            })

      // The report row types are precise interfaces without an index
      // signature; `toCsv` only needs string-keyed records, so widen here.
      const csv = toCsv(rows as unknown as Record<string, unknown>[])
      const key = `audit-log-exports/${request.siteId}/${requestId}/${report.kind.toLowerCase()}-${request.month}.csv`

      await uploadAuditLogExport({ key, body: csv })

      const url = await generateSignedGetUrl(
        { Bucket: bucket, Key: key },
        AUDIT_LOG_EXPORT_URL_EXPIRY_SECONDS,
      )

      objectKeys.push(key)
      links.push({ label: report.label, url })
    }

    // Step 5: one ready email with all links.
    await sendAuditLogExportReadyEmail({
      recipientEmail,
      siteName,
      month: toHumanReadableMonth(request.month),
      links,
    })

    // Step 6: mark Done.
    await db
      .updateTable("AuditLogExportRequest")
      .set({
        status: "Done",
        objectKeys,
        errorMessage: null,
        updatedAt: new Date(),
      })
      .where("id", "=", requestId)
      .execute()
  } catch (error) {
    // Step 7: failure handling. Increment attempts; re-queue or fail.
    const attempts = request.attempts + 1
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error"

    logger.error(
      { error, requestId, attempts },
      "Failed to process audit log export request",
    )

    if (attempts < MAX_ATTEMPTS) {
      // Re-queue for the next sweep.
      await db
        .updateTable("AuditLogExportRequest")
        .set({
          status: "Pending",
          attempts,
          errorMessage,
          updatedAt: new Date(),
        })
        .where("id", "=", requestId)
        .execute()
      return
    }

    // Exhausted retries — mark Failed and notify the requester (best-effort).
    await db
      .updateTable("AuditLogExportRequest")
      .set({
        status: "Failed",
        attempts,
        errorMessage,
        updatedAt: new Date(),
      })
      .where("id", "=", requestId)
      .execute()

    try {
      const failed = await db
        .selectFrom("AuditLogExportRequest")
        .innerJoin("Site", "Site.id", "AuditLogExportRequest.siteId")
        .innerJoin("User", "User.id", "AuditLogExportRequest.userId")
        .where("AuditLogExportRequest.id", "=", requestId)
        .select([
          "User.email as recipientEmail",
          "Site.name as siteName",
          "Site.config as config",
          "AuditLogExportRequest.month as month",
        ])
        .executeTakeFirstOrThrow()

      const failedConfig = failed.config as { siteName?: string } | null
      await sendAuditLogExportFailedEmail({
        recipientEmail: failed.recipientEmail,
        siteName: failedConfig?.siteName || failed.siteName,
        month: toHumanReadableMonth(failed.month),
      })
    } catch (emailError) {
      // The row is already Failed; a failed failure-email must not throw.
      logger.error(
        { error: emailError, requestId },
        "Failed to send audit log export failure email",
      )
    }
  }
}

/**
 * Cron entry point. Claims up to `BATCH_SIZE` Pending requests (oldest first)
 * and processes each. Per-row errors are caught so a single bad row never
 * aborts the rest of the batch.
 */
export const processPendingAuditLogExports = async (): Promise<void> => {
  const pending = await db
    .selectFrom("AuditLogExportRequest")
    .where("status", "=", "Pending")
    .orderBy("createdAt", "asc")
    .limit(BATCH_SIZE)
    .select("id")
    .execute()

  for (const { id } of pending) {
    try {
      await processAuditLogExportRequest(id)
    } catch (error) {
      // processAuditLogExportRequest handles its own errors, but guard the
      // batch loop defensively so one unexpected throw can't halt the sweep.
      logger.error(
        { error, requestId: id },
        "Unexpected error processing audit log export request in batch",
      )
    }
  }
}
