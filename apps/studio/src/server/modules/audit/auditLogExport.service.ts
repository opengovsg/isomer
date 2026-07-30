import { TRPCError } from "@trpc/server"
import { addDays, format, parseISO } from "date-fns"
import { sql } from "kysely"
import {
  sendAuditLogExportFailedEmail,
  sendAuditLogExportReadyEmail,
} from "~/features/mail/service"
import { createBaseLogger } from "~/lib/logger"
import {
  AUDIT_LOG_EXPORT_URL_EXPIRY_SECONDS,
  generateSignedGetUrl,
  getStudioAssetsBucketName,
  uploadAuditLogExport,
} from "~/lib/s3"
import {
  AuditLogExportRequestedReportType,
  type CreateAuditLogExportRequestInput,
  validateIsMonthInPastYear,
  validateIsNotFutureMonth,
} from "~/schemas/audit"

import type { BaseLogger } from "@isomer/logging"

import { AuditLogExportReportType } from "../database"
import { AuditLogExportStatus, db } from "../database"
import { PG_ERROR_CODES } from "../database/constants"
import {
  getAccessReportRows,
  getActivityReportRows,
  getMonthDateRange,
  parseAuditLogDateRange,
  toCsv,
} from "./auditLogExport.query"

type CreateAuditLogExportRequestProps = CreateAuditLogExportRequestInput & {
  userId: string
}

// Statuses that represent an export that is still in-flight; a duplicate
// request for the same (site, user, range, report type) should be rejected
// while one of these exists.
const IN_FLIGHT_STATUSES = [
  AuditLogExportStatus.Pending,
  AuditLogExportStatus.Processing,
]

// Fan-out from the requested (input) report type to the DB rows to insert.
// `Both` is UX vocabulary only (see schemas/audit.ts): it becomes TWO
// AuditLogExportRequest rows — one Access, one Activity — each fulfilled as an
// independent job. The DB enum has no `Both` member.
const REPORT_TYPES_BY_REQUESTED_TYPE: Record<
  AuditLogExportRequestedReportType,
  readonly AuditLogExportReportType[]
> = {
  [AuditLogExportRequestedReportType.Access]: [AuditLogExportReportType.Access],
  [AuditLogExportRequestedReportType.Activity]: [
    AuditLogExportReportType.Activity,
  ],
  [AuditLogExportRequestedReportType.Both]: [
    AuditLogExportReportType.Activity,
    AuditLogExportReportType.Access,
  ],
}

// The single report each row produces. `Both` is fanned out into two rows at
// request time (see REPORT_TYPES_BY_REQUESTED_TYPE), so every row here maps to
// exactly one report — one CSV, one download link, one email. Also used to
// name the specific report type in a CONFLICT error message.
const REPORT_BY_TYPE = {
  [AuditLogExportReportType.Access]: {
    kind: AuditLogExportReportType.Access,
    label: "access",
  },
  [AuditLogExportReportType.Activity]: {
    kind: AuditLogExportReportType.Activity,
    label: "audit",
  },
} as const

// Named per report type so a `Both` request that partially conflicts (e.g.
// access is already in flight but activity is not) tells the user which one,
// rather than a generic message that leaves them guessing.
const getInFlightConflictMessage = (reportType: AuditLogExportReportType) =>
  `An ${REPORT_BY_TYPE[reportType].label} log export for this period is already being generated`

export const createAuditLogExportRequest = async ({
  siteId,
  userId,
  month,
  reportType,
}: CreateAuditLogExportRequestProps) => {
  const futureMonthCheck = validateIsNotFutureMonth(month)
  const possibleError =
    futureMonthCheck !== true
      ? futureMonthCheck
      : validateIsMonthInPastYear(month)
  if (possibleError !== true) {
    logger.warn(possibleError)
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: possibleError.message,
    })
  }

  // The month picker is the user-facing input, but requests are stored as a
  // half-open SGT calendar-date range, `[YYYY-MM-DD,YYYY-MM-DD)` (see
  // getMonthDateRange — a current-month request is clamped to today + 1).
  const auditLogDateRange = getMonthDateRange(month, new Date())

  // The concrete DB report types this request fans out to: one row for
  // Access/Activity, two rows for Both.
  const reportTypes = REPORT_TYPES_BY_REQUESTED_TYPE[reportType]

  // In-flight dedupe is atomic. The real guard is a PARTIAL UNIQUE INDEX on
  // (siteId, userId, auditLogDateRange, reportType) WHERE status IN
  // ('Pending','Processing') (defined in the PR #2603 migration): the database
  // physically refuses a second in-flight row for the same range+report type,
  // so two concurrent identical requests cannot both insert. The SELECT below
  // is only a fast-path so the common (non-racing) duplicate returns a friendly
  // CONFLICT without relying on an exception; the losing side of an actual race
  // is caught from the INSERT's unique-violation and surfaced as the SAME
  // CONFLICT rather than a raw 500. All inserts for one request run inside ONE
  // transaction, all-or-nothing: if any insert of a `Both` fan-out loses the
  // race, the thrown CONFLICT rolls back the whole transaction and neither row
  // is committed.
  return db.transaction().execute(async (tx) => {
    const existing = await tx
      .selectFrom("AuditLogExportRequest")
      .where("siteId", "=", siteId)
      .where("userId", "=", userId)
      .where("auditLogDateRange", "=", auditLogDateRange)
      .where("reportType", "in", [...reportTypes])
      .where("status", "in", IN_FLIGHT_STATUSES)
      .select(["id", "reportType"])
      .executeTakeFirst()

    if (existing) {
      throw new TRPCError({
        code: "CONFLICT",
        message: getInFlightConflictMessage(existing.reportType),
      })
    }

    const inserted = []
    for (const dbReportType of reportTypes) {
      try {
        inserted.push(
          await tx
            .insertInto("AuditLogExportRequest")
            .values({
              siteId,
              userId,
              auditLogDateRange,
              reportType: dbReportType,
              status: AuditLogExportStatus.Pending,
              attempts: 0,
            })
            .returningAll()
            .executeTakeFirstOrThrow(),
        )
      } catch (error) {
        // Race-loser path: a concurrent request inserted an in-flight row for
        // this exact (siteId, userId, range, dbReportType) between our SELECT
        // and this INSERT, so the partial unique index rejected ours.
        // Translate that into the same friendly CONFLICT as the fast-path,
        // naming this specific report type; throwing aborts the transaction,
        // so earlier fan-out inserts in this loop roll back too
        // (all-or-nothing). Any other error (and any TRPCError thrown above)
        // is re-thrown as-is.
        if (
          error instanceof Error &&
          "code" in error &&
          error.code === PG_ERROR_CODES.uniqueViolation
        ) {
          throw new TRPCError({
            code: "CONFLICT",
            message: getInFlightConflictMessage(dbReportType),
          })
        }
        throw error
      }
    }
    // Return every inserted row (one for Access/Activity, two for Both).
    // The UI ignores the payload, so the array shape is chosen purely to
    // reflect the fan-out honestly.
    return inserted
  })
}

// ---------------------------------------------------------------------------
// Fulfilment orchestrator (LAYER 4c)
// ---------------------------------------------------------------------------

const logger: BaseLogger = createBaseLogger({
  path: "modules/audit/auditLogExport.service",
})

// After this many started attempts (charged at claim time) a failing request
// is marked Failed (and the requester emailed) rather than retried again on
// the next sweep.
const MAX_ATTEMPTS = 3

// Number of Pending requests claimed per cron sweep. Keeps each minute's run
// bounded so one large backlog cannot monopolise the worker.
const BATCH_SIZE = 20

// A row is moved to `Processing` the moment a sweep claims it, and only moved
// back to `Pending` by the in-process `catch`. If the worker is killed or
// redeployed after the claim but before that catch runs, the row would
// otherwise stay `Processing` forever — never retried, requester never
// emailed. We treat any `Processing` row whose `updatedAt` is older than this
// lease as an abandoned claim and allow a later sweep to re-claim it.
//
// 15 minutes is comfortably longer than the worst-case time to process a
// single request (query + CSV + S3 upload + email, all with short timeouts),
// so a still-running worker's claim will never be stolen mid-flight, while a
// genuinely dead worker's rows are recovered within a couple of sweeps.
const PROCESSING_LEASE_MS = 15 * 60 * 1000

/**
 * Human-readable label for an export's period (e.g. "June 2026") for the email
 * subject/body, derived from the stored daterange's inclusive lower bound
 * (already an SGT calendar date). The picker is month-based, so the lower
 * bound is the 1st of the month and the month name is an accurate label.
 */
const getExportPeriodLabel = (auditLogDateRange: string): string => {
  const { lowerInclusive } = parseAuditLogDateRange(auditLogDateRange)
  return format(parseISO(lowerInclusive), "MMMM yyyy")
}

/**
 * Slug for the S3 object key, rendering the half-open stored range with an
 * INCLUSIVE end for human readability: `[2026-04-01,2026-05-01)` →
 * `2026-04-01-to-2026-04-30`. Plain calendar arithmetic on the date string —
 * the bounds are SGT calendar dates and SGT has no DST.
 */
const getRangeSlug = (auditLogDateRange: string): string => {
  const { lowerInclusive, upperExclusive } =
    parseAuditLogDateRange(auditLogDateRange)
  const upperInclusive = format(
    addDays(parseISO(upperExclusive), -1),
    "yyyy-MM-dd",
  )
  return `${lowerInclusive}-to-${upperInclusive}`
}

/**
 * Process a single export request, identified by id.
 *
 * Step 1 claims the row atomically so that concurrent sweeps never
 * double-process it. A row is claimable if it is `Pending`, OR if it is
 * `Processing` but its `updatedAt` is older than `staleCutoff` (an abandoned
 * claim left behind by a killed/redeployed worker — see PROCESSING_LEASE_MS).
 * The `WHERE` guard plus `RETURNING` make the claim race-safe: if no row comes
 * back, another sweep already grabbed it (or it is freshly Processing) and we
 * skip. `attempts` counts processing attempts STARTED: every claim (fresh or
 * stale re-claim) charges attempts + 1 atomically, so an attempt is counted
 * exactly once whether it ends in a caught error, a dead worker, or success —
 * a repeatedly-crashing row still exhausts MAX_ATTEMPTS instead of looping
 * forever, and a stale re-claim that fails is never double-charged.
 *
 * Steps 2–6 (load site/user, generate CSVs, upload to S3, sign URLs, send the
 * ready email, mark Done) are wrapped in a try/catch: on any failure we
 * either re-queue the row (Pending) for the next sweep or, once the
 * already-charged `attempts >= MAX_ATTEMPTS`, mark it Failed and best-effort
 * email the requester. Raw errors are only ever logged, never surfaced to the
 * recipient.
 *
 * @param staleCutoff Rows that are `Processing` with `updatedAt < staleCutoff`
 * are treated as abandoned and re-claimable. Passed in by the sweep so every
 * row in one batch uses the same cutoff instant.
 */
export const processAuditLogExportRequest = async (
  requestId: string,
  staleCutoff: Date,
): Promise<void> => {
  // Step 1: atomic claim. Claim a fresh `Pending` row, or re-claim a
  // `Processing` row whose lease has expired (abandoned by a dead worker).
  // Every claim charges the attempt up front — the catch never increments, so
  // a stale re-claim that fails again is charged once, not twice.
  const request = await db
    .updateTable("AuditLogExportRequest")
    .set({
      status: AuditLogExportStatus.Processing,
      updatedAt: new Date(),
      attempts: sql<number>`attempts + 1`,
    })
    .where("id", "=", requestId)
    .where((eb) =>
      eb.or([
        eb("status", "=", AuditLogExportStatus.Pending),
        eb.and([
          eb("status", "=", AuditLogExportStatus.Processing),
          eb("updatedAt", "<", staleCutoff),
          eb("AuditLogExportRequest.attempts", "<", MAX_ATTEMPTS),
        ]),
      ]),
    )
    .returningAll()
    .executeTakeFirst()

  if (!request) {
    // Another sweep claimed it, it is no longer Pending, or it is a
    // still-fresh Processing row within its lease — skip silently.
    return
  }

  // Step 2: load the site (for a display name) and the requesting user (for the
  // recipient email). Loaded before the try so the failure-email path below can
  // reuse them instead of re-querying. The row was just claimed and both are
  // FK-backed, so these never miss in practice.
  const site = await db
    .selectFrom("Site")
    .where("id", "=", request.siteId)
    .select(["id", "name", "config"])
    .executeTakeFirstOrThrow()

  const user = await db
    .selectFrom("User")
    .innerJoin("ResourcePermission", "ResourcePermission.userId", "User.id")
    .where("User.id", "=", request.userId)
    .where("ResourcePermission.userId", "=", request.userId)
    .where("ResourcePermission.role", "=", "Admin")
    .where("ResourcePermission.siteId", "=", site.id)
    .select(["User.id", "User.email"])
    .executeTakeFirst()

  // NOTE: Early return - this is technically not a failure
  // because it means that the user has been removed from the site
  // as an admin between the job creation and fulfillment time
  if (!user) {
    logger.warn(
      { requestId, userId: request.userId },
      "User no longer exists or is not an admin",
    )
    await db
      .updateTable("AuditLogExportRequest")
      .set({
        status: AuditLogExportStatus.Failed,
        errorMessage: "User no longer exists or is not an admin",
        updatedAt: new Date(),
      })
      .where("id", "=", requestId)
      .execute()
    return
  }

  const siteConfig = site.config
  const siteName = siteConfig?.siteName || site.name
  const recipientEmail = user.email

  try {
    // Step 3 + 4: run the row's single report query, serialise to CSV
    // (always — header-only CSV for zero rows), upload, and sign a download
    // URL. `Both` requests were fanned out into two rows at request time, so
    // one row is always exactly one report.
    const report = REPORT_BY_TYPE[request.reportType]
    const bucket = getStudioAssetsBucketName()

    const rows =
      report.kind === "Access"
        ? await getAccessReportRows({
            siteId: request.siteId,
            auditLogDateRange: request.auditLogDateRange,
          })
        : await getActivityReportRows({
            siteId: request.siteId,
            auditLogDateRange: request.auditLogDateRange,
          })

    const csv = toCsv(rows)
    const rangeSlug = getRangeSlug(request.auditLogDateRange)
    const objectKey = `audit-log-exports/${request.siteId}/${requestId}/${report.kind.toLowerCase()}-${rangeSlug}.csv`

    await uploadAuditLogExport({ key: objectKey, body: csv })

    const url = await generateSignedGetUrl(
      { Bucket: bucket, Key: objectKey },
      AUDIT_LOG_EXPORT_URL_EXPIRY_SECONDS,
    )

    // Step 5: one ready email with the single download link. A "Both" user
    // request is two independent rows, so it yields two independent emails —
    // no cross-job coordination.
    await sendAuditLogExportReadyEmail({
      recipientEmail,
      siteName,
      month: getExportPeriodLabel(request.auditLogDateRange),
      link: { label: report.label, url },
    })

    // Step 6: mark Done.
    await db
      .updateTable("AuditLogExportRequest")
      .set({
        status: AuditLogExportStatus.Done,
        objectKey,
        errorMessage: null,
        updatedAt: new Date(),
        completedAt: new Date(),
      })
      .where("id", "=", requestId)
      .execute()
  } catch (error) {
    // Step 7: failure handling. The claim already charged this attempt, so
    // `request.attempts` (post-claim) is authoritative — re-queue or fail.
    const { attempts } = request
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error"

    logger.error(
      { error, requestId, attempts },
      "Failed to process audit log export request",
    )

    if (attempts < MAX_ATTEMPTS) {
      // Re-queue for the next sweep; `attempts` is already persisted.
      await db
        .updateTable("AuditLogExportRequest")
        .set({
          status: AuditLogExportStatus.Pending,
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
        status: AuditLogExportStatus.Failed,
        errorMessage,
        updatedAt: new Date(),
      })
      .where("id", "=", requestId)
      .execute()

    try {
      // Reuse the site/user already loaded above instead of re-querying.
      await sendAuditLogExportFailedEmail({
        recipientEmail,
        siteName,
        month: getExportPeriodLabel(request.auditLogDateRange),
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
 * Cron entry point. Claims up to `BATCH_SIZE` requests (oldest first) and
 * processes each. Candidates are rows that are `Pending`, plus rows stuck in
 * `Processing` past their lease (PROCESSING_LEASE_MS) — abandoned claims from a
 * worker that died between the claim and the in-process catch. Per-row errors
 * are caught so a single bad row never aborts the rest of the batch.
 *
 * Stale `Processing` rows that have already exhausted `MAX_ATTEMPTS` are
 * excluded here, mirroring the claim guard in `processAuditLogExportRequest`:
 * such a row can never actually be claimed, so selecting it would only waste
 * a batch slot on a guaranteed no-op — and with `BATCH_SIZE` candidates
 * ordered oldest-first, enough exhausted rows would starve newer `Pending`
 * exports out of every sweep.
 */
export const processPendingAuditLogExports = async (): Promise<void> => {
  // A single cutoff instant for the whole sweep: the batch selector and the
  // per-row atomic claim must agree on what counts as "stale".
  const staleCutoff = new Date(Date.now() - PROCESSING_LEASE_MS)

  const pending = await db
    .selectFrom("AuditLogExportRequest")
    .where((eb) =>
      eb.or([
        eb("status", "=", AuditLogExportStatus.Pending),
        eb.and([
          eb("status", "=", AuditLogExportStatus.Processing),
          eb("updatedAt", "<", staleCutoff),
          eb("attempts", "<", MAX_ATTEMPTS),
        ]),
      ]),
    )
    .orderBy("createdAt", "asc")
    .limit(BATCH_SIZE)
    .select("id")
    .execute()

  for (const { id } of pending) {
    try {
      await processAuditLogExportRequest(id, staleCutoff)
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
