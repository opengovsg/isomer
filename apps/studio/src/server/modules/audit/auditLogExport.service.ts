import { TRPCError } from "@trpc/server"
import {
  addDays,
  format,
  isAfter,
  isBefore,
  isSameMonth,
  parseISO,
} from "date-fns"
import { sql } from "kysely"
import { env } from "~/env.mjs"
import {
  sendAuditLogExportFailedEmail,
  sendAuditLogExportReadyEmail,
} from "~/features/mail/service"
import { createBaseLogger } from "~/lib/logger"
import {
  getFileSize,
  getStudioAssetsBucketName,
  uploadAuditLogExport,
} from "~/lib/s3"
import {
  type AuditLogExportRequestedReportType,
  type CreateAuditLogExportRequestInput,
  getCurrentSingaporeMonth,
  getEarliestExportableMonth,
} from "~/schemas/audit"

import type { BaseLogger } from "@isomer/logging"

import type { AuditLogExportReportType } from "../database"
import { db } from "../database"
import { validatePermissionsForManagingUsers } from "../permissions/permissions.service"
import { logAuditLogExportEvent } from "./audit.service"
import {
  getAccessReportRows,
  getActivityReportRows,
  getExportRange,
  getMonthDateRange,
  parseAuditLogDateRange,
  toCsv,
} from "./auditLogExport.query"
import { sealAuditLogExportToken } from "./auditLogExportToken"

type CreateAuditLogExportRequestProps = CreateAuditLogExportRequestInput & {
  userId: string
  // Requester IP, resolved by the router (getIP(ctx.req)) and recorded on the
  // AuditLogExportCreate event, matching sibling resource/permission/login
  // events. Optional so non-request callers (tests, future jobs) can omit it.
  ip?: string
}

// Statuses that represent an export that is still in-flight; a duplicate
// request for the same (site, user, range, report type) is accepted
// idempotently (the existing row is returned) while one of these exists.
const IN_FLIGHT_STATUSES = ["Pending", "Processing"] as const

// Fan-out from the requested (input) report type to the DB rows to insert.
// `Both` is UX vocabulary only (see schemas/audit.ts): it becomes TWO
// AuditLogExportRequest rows — one Access, one Activity — each fulfilled as an
// independent job. The DB enum has no `Both` member.
const REPORT_TYPES_BY_REQUESTED_TYPE: Record<
  AuditLogExportRequestedReportType,
  readonly AuditLogExportReportType[]
> = {
  Access: ["Access"],
  Activity: ["Activity"],
  Both: ["Access", "Activity"],
}

export const createAuditLogExportRequest = async ({
  siteId,
  userId,
  month,
  reportType,
  ip,
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

  // The month picker is the user-facing input, but requests are stored as a
  // half-open SGT calendar-date range, `[YYYY-MM-DD,YYYY-MM-DD)` (see
  // getMonthDateRange — a current-month request is clamped to today + 1).
  const auditLogDateRange = getMonthDateRange(month, new Date())

  // The concrete DB report types this request fans out to: one row for
  // Access/Activity, two rows for Both.
  const reportTypes = REPORT_TYPES_BY_REQUESTED_TYPE[reportType]

  // Asking is ALWAYS safe (ADR docs/adr/0005): a duplicate ask is accepted
  // idempotently, never rejected. The PARTIAL UNIQUE INDEX on (siteId, userId,
  // auditLogDateRange, reportType) WHERE status IN ('Pending','Processing')
  // (defined in the PR #2603 migration) is now purely a RACE GUARD — it is
  // what lets two concurrent identical asks resolve to ONE in-flight row
  // instead of two, not a reason to error. Per fanned-out report type:
  //
  //   1. Fast path: an in-flight row for the same (site, user, range, type)
  //      already exists → use it, insert nothing.
  //   2. Otherwise INSERT ... ON CONFLICT DO NOTHING targeting that partial
  //      index. Losing the race between the SELECT and the INSERT therefore
  //      cannot raise a unique-violation (which would abort the whole
  //      Postgres transaction and roll back the other fan-out half); the
  //      insert simply returns no row, and we SELECT the winner's in-flight
  //      row and use that instead. Any other insert error still rethrows.
  //
  // Every ask — including one where all halves were idempotent-accepted — is
  // recorded as ONE AuditLogExportCreate audit event in the same transaction,
  // so agencies can always see who asked to export their logs.
  return db.transaction().execute(async (tx) => {
    const rows = []
    for (const dbReportType of reportTypes) {
      const inFlightRowQuery = tx
        .selectFrom("AuditLogExportRequest")
        .where("siteId", "=", siteId)
        .where("userId", "=", userId)
        .where("auditLogDateRange", "=", auditLogDateRange)
        .where("reportType", "=", dbReportType)
        .where("status", "in", IN_FLIGHT_STATUSES)
        .selectAll()

      // Fast path: idempotent-accept the common (non-racing) duplicate.
      const existing = await inFlightRowQuery.executeTakeFirst()
      if (existing) {
        rows.push(existing)
        continue
      }

      const inserted = await tx
        .insertInto("AuditLogExportRequest")
        .values({
          siteId,
          userId,
          auditLogDateRange,
          reportType: dbReportType,
          status: "Pending",
          attempts: 0,
        })
        // Target the partial unique index so a race-losing insert is a no-op
        // rather than a transaction-aborting unique-violation.
        .onConflict((oc) =>
          oc
            .columns(["siteId", "userId", "auditLogDateRange", "reportType"])
            .where("status", "in", [...IN_FLIGHT_STATUSES])
            .doNothing(),
        )
        .returningAll()
        .executeTakeFirst()

      if (inserted) {
        rows.push(inserted)
        continue
      }

      // Race-loser path: a concurrent identical ask inserted its in-flight
      // row between our SELECT and INSERT, so DO NOTHING swallowed ours.
      // The winner's row is committed and visible by now — use it.
      rows.push(await inFlightRowQuery.executeTakeFirstOrThrow())
    }

    // Exactly ONE event per ask (not per fanned-out half), recorded even when
    // every half was idempotent-accepted: the ask itself is the auditable act.
    // The delta stores the REQUESTED report type — possibly "Both" — because
    // that is what the user asked for; the fan-out is an implementation detail.
    const requestedBy = await tx
      .selectFrom("User")
      .where("id", "=", userId)
      .selectAll()
      .executeTakeFirstOrThrow()
    await logAuditLogExportEvent(tx, {
      eventType: "AuditLogExportCreate",
      by: requestedBy,
      siteId,
      ip,
      delta: {
        before: null,
        after: { auditLogDateRange, reportType },
      },
    })

    // Return every row backing this ask (one for Access/Activity, two for
    // Both) — existing in-flight rows and fresh inserts alike. The UI ignores
    // the payload, so the array shape is chosen purely to reflect the fan-out
    // honestly.
    return rows
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

// The single report each row produces. `Both` is fanned out into two rows at
// request time (see REPORT_TYPES_BY_REQUESTED_TYPE), so every row here maps to
// exactly one report — one CSV, one download link, one email.
const REPORT_BY_TYPE = {
  Access: { kind: "Access", label: "access" },
  Activity: { kind: "Activity", label: "audit" },
} as const

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
 * Steps 2–6 (load site/user, reuse a Complete Artifact or generate + upload
 * the CSV, mark Done with `completedAt`, then send the ready email)
 * are wrapped in a try/catch: on any failure we
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
      status: "Processing",
      updatedAt: new Date(),
      attempts: sql<number>`attempts + 1`,
    })
    .where("id", "=", requestId)
    .where((eb) =>
      eb.or([
        eb("status", "=", "Pending"),
        eb.and([
          eb("status", "=", "Processing"),
          eb("updatedAt", "<", staleCutoff),
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

    const report = REPORT_BY_TYPE[request.reportType]
    const bucket = getStudioAssetsBucketName()

    // Step 3: Complete-Artifact reuse (ADR docs/adr/0005). A Done row for the
    // same (site, range, report type) whose `completedAt` is at or after the
    // range's exclusive end instant was generated AFTER the range had fully
    // elapsed; audit records are append-only, so its artifact can never go
    // stale and re-delivering it is safe. A Done row completed BEFORE the
    // range end (an in-progress-month snapshot, whose clamped range carries a
    // future end) is a point-in-time snapshot and never reused. Reuse is
    // PER-SITE — the artifact is a function of (site, range, type) only, so a
    // different requester's artifact qualifies. Failed rows never qualify
    // (status must be Done) and the latest qualifying artifact wins.
    const { rangeEnd } = getExportRange(request.auditLogDateRange)
    const completeArtifact = await db
      .selectFrom("AuditLogExportRequest")
      .where("id", "!=", requestId)
      .where("siteId", "=", request.siteId)
      .where("auditLogDateRange", "=", request.auditLogDateRange)
      .where("reportType", "=", request.reportType)
      .where("status", "=", "Done")
      .where("objectKey", "is not", null)
      .where("completedAt", ">=", rangeEnd)
      .orderBy("completedAt", "desc")
      .select("objectKey")
      .limit(1)
      .executeTakeFirst()

    let objectKey = completeArtifact?.objectKey ?? null
    if (objectKey !== null) {
      // The artifact row may outlive the S3 object (e.g. a future lifecycle
      // policy): verify the object still exists before promising it. Only a
      // genuinely-absent object (getFileSize returns null on a 404/NoSuchKey)
      // falls through to regeneration; a transient S3/network error propagates
      // out of getFileSize into this attempt's catch, which re-queues the row
      // for retry rather than needlessly regenerating the whole artifact.
      const artifactSize = await getFileSize({ Bucket: bucket, Key: objectKey })
      if (artifactSize === null) {
        objectKey = null
      }
    }

    // Step 4: no reusable artifact — run the row's single report query,
    // serialise to CSV (always — header-only CSV for zero rows), and upload.
    // `Both` requests were fanned out into two rows at request time, so one
    // row is always exactly one report.
    if (objectKey === null) {
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
      objectKey = `audit-log-exports/${request.siteId}/${requestId}/${report.kind.toLowerCase()}-${rangeSlug}.csv`

      await uploadAuditLogExport({ key: objectKey, body: csv })
    }

    // Both paths converge here. We do NOT presign the S3 object now: a SigV4
    // URL is capped by the signing credentials' lifetime (~1h on the ECS task
    // role), so an emailed "3-day" presigned URL silently died within the hour
    // (ADR 0006). Instead we email a sealed Download Token pointing at a
    // Studio endpoint that presigns fresh (short expiry) at CLICK time. The
    // token carries only the request id; the row stays the source of truth on
    // redemption. `objectKey` is stamped onto the row in step 5, so the route
    // can re-read it. The email copy's "expires in 3 days" stays true — the
    // Download Window still anchors to this row's completedAt.
    const token = await sealAuditLogExportToken(requestId)
    const url = `${env.NEXT_PUBLIC_APP_URL}/api/audit-log-exports/download?token=${encodeURIComponent(token)}`

    // Step 5: mark Done BEFORE emailing. The download route only honours Done
    // rows, so the row must be Done by the time the token can land in an
    // inbox — emailing first left a window (and, if this UPDATE then threw, a
    // whole re-queue cycle) during which a delivered link redirected to
    // "expired". `completedAt` is set on BOTH paths (reuse and generate): it
    // anchors this row's Download Window and is what a later request compares
    // against `rangeEnd` to decide whether THIS row holds a Complete Artifact.
    // If the email send below fails, the catch re-queues the row and the retry
    // re-marks it Done — the same requestId keeps any (re)sent token valid.
    // Residual trade-off: a crash between this UPDATE and the send leaves a
    // Done row whose email never went out (sweeps skip Done rows); that window
    // is two adjacent awaits, versus the deterministic dead-link window the
    // old ordering had on every single request.
    await db
      .updateTable("AuditLogExportRequest")
      .set({
        status: "Done",
        objectKey,
        completedAt: new Date(),
        errorMessage: null,
        updatedAt: new Date(),
      })
      .where("id", "=", requestId)
      .execute()

    // Step 6: one ready email with the single download link. A "Both" user
    // request is two independent rows, so it yields two independent emails —
    // no cross-job coordination.
    await sendAuditLogExportReadyEmail({
      recipientEmail,
      siteName,
      month: getExportPeriodLabel(request.auditLogDateRange),
      link: { label: report.label, url },
    })
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
          status: "Pending",
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
          "AuditLogExportRequest.auditLogDateRange as auditLogDateRange",
        ])
        .executeTakeFirstOrThrow()

      const failedConfig = failed.config as { siteName?: string } | null
      await sendAuditLogExportFailedEmail({
        recipientEmail: failed.recipientEmail,
        siteName: failedConfig?.siteName || failed.siteName,
        month: getExportPeriodLabel(failed.auditLogDateRange),
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
 */
export const processPendingAuditLogExports = async (): Promise<void> => {
  // A single cutoff instant for the whole sweep: the batch selector and the
  // per-row atomic claim must agree on what counts as "stale".
  const staleCutoff = new Date(Date.now() - PROCESSING_LEASE_MS)

  const pending = await db
    .selectFrom("AuditLogExportRequest")
    .where((eb) =>
      eb.or([
        eb("status", "=", "Pending"),
        eb.and([
          eb("status", "=", "Processing"),
          eb("updatedAt", "<", staleCutoff),
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
