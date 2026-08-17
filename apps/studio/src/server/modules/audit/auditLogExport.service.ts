import { TRPCError } from "@trpc/server"
import { addDays, differenceInCalendarMonths, format, parseISO } from "date-fns"
import { toZonedTime } from "date-fns-tz"
import { sql } from "kysely"
import { Readable } from "node:stream"
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
  AUDIT_LOG_EXPORT_MAX_MONTHS,
  type CreateAuditLogExportRequestInput,
  getCurrentSingaporeMonth,
  validateIsMonthInPastYear,
  validateIsNotFutureMonth,
} from "~/schemas/audit"
import { AuditLogExportStatus } from "~prisma/generated/generatedEnums"

import type { BaseLogger } from "@isomer/logging"

import { AuditLogExportReportType, db, RoleType } from "../database"
import { getResourcePermission } from "../permissions/permissions.service"
import { logAuditLogExportEvent } from "./audit.service"
import {
  accessReportQuery,
  activityReportQuery,
  createCsvTransform,
  getExportRange,
  getMonthDateRange,
  parseAuditLogDateRange,
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

// The single report each row produces — one CSV, one download link, one
// email.
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

export const createAuditLogExportRequest = async ({
  siteId,
  userId,
  month,
  reportType,
  ip,
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

  // The month picker is the user-facing input, but it only ever applies to
  // Activity ("Audit logs") — an Access export always reflects the CURRENT
  // month regardless of what's picked, since its own surface
  // (ExportAccessLogsButton) never shows a month picker at all.
  const now = new Date()
  const auditLogDateRange =
    reportType === AuditLogExportReportType.Access
      ? getMonthDateRange(getCurrentSingaporeMonth(), now)
      : getMonthDateRange(month, now)

  // Asking is ALWAYS safe (ADR docs/adr/0005): a duplicate ask is accepted
  // idempotently, never rejected. The PARTIAL UNIQUE INDEX on (siteId, userId,
  // auditLogDateRange, reportType) WHERE status IN ('Pending','Processing')
  // (defined in the PR #2603 migration) is now purely a RACE GUARD — it is
  // what lets two concurrent identical asks resolve to ONE in-flight row
  // instead of two, not a reason to error.
  //
  //   1. Fast path: an in-flight row for the same (site, user, range, type)
  //      already exists → use it, insert nothing.
  //   2. Otherwise INSERT ... ON CONFLICT DO NOTHING targeting that partial
  //      index. Losing the race between the SELECT and the INSERT therefore
  //      cannot raise a unique-violation; the insert simply returns no row,
  //      and we SELECT the winner's in-flight row and use that instead. Any
  //      other insert error still rethrows.
  //
  // Recorded as ONE AuditLogExportCreate audit event in the same transaction,
  // so agencies can always see who asked to export their logs.
  return db.transaction().execute(async (tx) => {
    const inFlightRowQuery = tx
      .selectFrom("AuditLogExportRequest")
      .where("siteId", "=", siteId)
      .where("userId", "=", userId)
      .where("auditLogDateRange", "=", auditLogDateRange)
      .where("reportType", "=", reportType)
      .where("status", "in", IN_FLIGHT_STATUSES)
      .selectAll()

    // Fast path: idempotent-accept the common (non-racing) duplicate.
    const existing = await inFlightRowQuery.executeTakeFirst()

    const row =
      existing ??
      (await tx
        .insertInto("AuditLogExportRequest")
        .values({
          siteId,
          userId,
          auditLogDateRange,
          reportType,
          status: AuditLogExportStatus.Pending,
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
        .executeTakeFirst()) ??
      // Race-loser path: a concurrent identical ask inserted its in-flight
      // row between our SELECT and INSERT, so DO NOTHING swallowed ours.
      // The winner's row is committed and visible by now — use it.
      (await inFlightRowQuery.executeTakeFirstOrThrow())

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

    // Returned as a single-element array so existing callers can keep
    // treating the result as "every row backing this ask".
    return [row]
  })
}

// The fixed business timezone for audit months — see the SGT rationale on
// `getCurrentSingaporeMonth` in schemas/audit.ts.
const SINGAPORE_TIME_ZONE = "Asia/Singapore"

// How many months back the audit-log export picker/window may offer for a
// site created on `siteCreatedAt`: the standard export window
// (AUDIT_LOG_EXPORT_MAX_MONTHS), or fewer if the site is younger than that —
// there is nothing to export before the site existed. Always at least 1 (the
// current month), even if `siteCreatedAt` is unexpectedly in the future.
// `toZonedTime` re-labels each instant with SGT wall-clock fields (same
// technique as `getMonthDateRange` in auditLogExport.query.ts), so the plain
// date-fns `differenceInCalendarMonths` below operates on SGT calendar
// months regardless of the server's own timezone.
export const getMaxExportableMonths = (
  siteCreatedAt: Date,
  now: Date = new Date(),
): number => {
  const zonedCreatedAt = toZonedTime(siteCreatedAt, SINGAPORE_TIME_ZONE)
  const zonedNow = toZonedTime(now, SINGAPORE_TIME_ZONE)
  // +1 to make the count inclusive of both the creation month and the
  // current month (e.g. a site created this same calendar month -> 1).
  const monthsSinceCreation =
    differenceInCalendarMonths(zonedNow, zonedCreatedAt) + 1
  return Math.min(AUDIT_LOG_EXPORT_MAX_MONTHS, Math.max(1, monthsSinceCreation))
}

// How many months back the export picker may offer for this site — the
// standard window, or fewer if the site is younger than that (see
// `getMaxExportableMonths`).
export const getAuditLogExportWindow = async (
  siteId: number,
): Promise<{ maxMonths: number }> => {
  const { createdAt } = await db
    .selectFrom("Site")
    .where("id", "=", siteId)
    .select("createdAt")
    .executeTakeFirstOrThrow()

  return { maxMonths: getMaxExportableMonths(createdAt) }
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

// Rows are pulled from Postgres in cursor batches of this size (via Kysely's
// `.stream()`) and piped straight through CSV serialisation into the S3
// multipart upload, so a large export never fully materialises in memory.
const STREAM_CHUNK_SIZE = 500

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

  const [user, roles] = await Promise.all([
    db
      .selectFrom("User")
      .where("User.id", "=", request.userId)
      .where("User.deletedAt", "is", null)
      .select(["User.id", "User.email"])
      .executeTakeFirst(),
    getResourcePermission({ userId: request.userId, siteId: site.id }),
  ])
  const isAdmin = roles.some(({ role }) => role === RoleType.Admin)

  // NOTE: Early return - the requester no longer exists or lost their
  // effective Admin access between request creation and fulfillment.
  if (!user || !isAdmin) {
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
    // URL. Every row is exactly one report.
    const report = REPORT_BY_TYPE[request.reportType]
    const bucket = getStudioAssetsBucketName()

    // Step 3: Complete-Artifact reuse (ADR docs/adr/0005). A Done row for the
    // same (site, range, report type) whose `completedAt` is at or after the
    // range's exclusive end instant holds data frozen AFTER the range had
    // fully elapsed; audit records are append-only, so its artifact can never
    // go stale and re-delivering it is safe. This is sound only because the
    // generate path stamps `completedAt` with an instant captured BEFORE its
    // report query runs (see Step 4/6) — stamping at finish time would let a
    // current-month job query an incomplete day, cross SGT midnight (or spend
    // time in retries) during upload/email, and then advertise a permanently
    // incomplete CSV as complete. A row whose data was frozen BEFORE the
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
    // The instant this row's data was frozen — captured immediately before
    // the report query on the generate path. Stays null on the reuse path (no
    // query of its own), where delivery time is a sound completeness stamp
    // because reuse only ever hands out an already-complete artifact.
    let queriedAt: Date | null = null
    // Bytes of the CSV this row delivers — reused from the artifact check
    // below on the reuse path, or measured fresh after upload on the generate
    // path. Purely for observability (logged ahead of the ready email);
    // never persisted or emailed.
    let objectSize: number | null = null
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
      } else {
        objectSize = artifactSize
      }
    }

    // Step 4: no reusable artifact — run the row's single report query and
    // stream it straight to S3: Postgres cursor → CSV transform → multipart
    // upload, so a large export never buffers fully in memory. An empty result
    // yields an empty object (matching the former buffered behaviour).
    if (objectKey === null) {
      // The CSV's contents are frozen the moment the report query's cursor
      // starts reading, so the completeness instant is captured HERE —
      // before the stream is built or consumed — not when the job finishes.
      // This is what makes the reuse predicate above sound.
      queriedAt = new Date()
      const queryParams = {
        siteId: request.siteId,
        auditLogDateRange: request.auditLogDateRange,
      }
      const rowStream = Readable.from(
        report.kind === "Access"
          ? accessReportQuery(queryParams).stream(STREAM_CHUNK_SIZE)
          : activityReportQuery(queryParams).stream(STREAM_CHUNK_SIZE),
      )
      const csvStream = createCsvTransform()
      // `.pipe` does not forward source errors, so a failing query/cursor would
      // otherwise leave `csvStream` open and hang the upload. Destroying it with
      // the error surfaces on the upload, which rejects into this attempt's
      // catch for a retry.
      rowStream.on("error", (error) => csvStream.destroy(error))
      rowStream.pipe(csvStream)

      const rangeSlug = getRangeSlug(request.auditLogDateRange)
      objectKey = `audit-log-exports/${request.siteId}/${requestId}/${report.kind.toLowerCase()}-${rangeSlug}.csv`

      try {
        await uploadAuditLogExport({ key: objectKey, body: csvStream })
        objectSize = await getFileSize({ Bucket: bucket, Key: objectKey })
      } finally {
        // Tear the cursor down even if the upload consumer bailed early (or
        // never read the stream), so a failed/short-circuited upload never
        // leaks the underlying DB connection. A no-op once the stream has
        // already ended on the success path.
        rowStream.destroy()
      }
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
    // "expired". `completedAt` is set on BOTH paths: it anchors this row's
    // Download Window and is what a later request compares against `rangeEnd`
    // to decide whether THIS row holds a Complete Artifact — so on the
    // generate path it carries the pre-query freeze instant (`queriedAt`),
    // NOT the time this update runs: the two can straddle the range end (SGT
    // midnight, retries), and stamping at finish time would advertise a
    // permanently incomplete CSV as complete. The reuse path ran no query, so
    // delivery time is used there.
    // If the email send below fails, the catch re-queues the row and the retry
    // re-marks it Done — the same requestId keeps any (re)sent token valid.
    // Residual trade-off: a crash between this UPDATE and the send leaves a
    // Done row whose email never went out (sweeps skip Done rows); that window
    // is two adjacent awaits, versus the deterministic dead-link window the
    // old ordering had on every single request.
    await db
      .updateTable("AuditLogExportRequest")
      .set({
        status: AuditLogExportStatus.Done,
        objectKey,
        completedAt: queriedAt ?? new Date(),
        errorMessage: null,
        updatedAt: new Date(),
      })
      .where("id", "=", requestId)
      .execute()

    logger.info(
      { requestId, objectKey, bytes: objectSize },
      "Audit log export CSV ready for delivery",
    )

    // Step 6: one ready email with the single download link.
    await sendAuditLogExportReadyEmail({
      recipientEmail,
      siteName,
      month: getExportPeriodLabel(request.auditLogDateRange),
      link: { label: report.label, url },
      sizeInBytes: objectSize,
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
