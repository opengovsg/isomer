import type { RawBuilder } from "kysely"
import type { IsoMonth } from "~/schemas/audit"
import { addDays, addMonths, format, startOfMonth } from "date-fns"
import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz"
import Papa from "papaparse"

import type { AccessReportRow, AuditReportQueryParams } from "./audit.types"
import { AuditLogEvent, db, sql } from "../database"

// NOTE: Sentinel for middle of month to ensure that we always land inside a month
// and not have to worry about TZ conversion
const MID_OF_MONTH = 15 as const

// The fixed business timezone for audit months. We convert through date-fns-tz
// (rather than hardcoding the +08:00 offset) so the zone handling is explicit.
const SINGAPORE_TIME_ZONE = "Asia/Singapore"

// Canonical Postgres daterange form: `[YYYY-MM-DD,YYYY-MM-DD)` — inclusive
// lower, exclusive upper. The bounds are SGT (Asia/Singapore) CALENDAR DATES,
// and the DB CHECK guarantees the stored range is non-empty and bounded.
// Postgres always echoes ranges back in this canonical form.
const AUDIT_LOG_DATE_RANGE_REGEX =
  /^\[(\d{4}-\d{2}-\d{2}),(\d{4}-\d{2}-\d{2})\)$/

/**
 * Serialize SGT calendar-date bounds into the canonical daterange string,
 * `[lowerInclusive,upperExclusive)`.
 */
export const formatAuditLogDateRange = (
  lowerInclusive: string,
  upperExclusive: string,
): string => `[${lowerInclusive},${upperExclusive})`

/**
 * Parse a canonical daterange string back into its SGT calendar-date bounds.
 * Throws on non-canonical input — defensive only, since the DB CHECK plus
 * Postgres canonicalisation guarantee we only ever read the canonical form.
 */
export const parseAuditLogDateRange = (
  auditLogDateRange: string,
): { lowerInclusive: string; upperExclusive: string } => {
  const match = AUDIT_LOG_DATE_RANGE_REGEX.exec(auditLogDateRange)
  if (!match?.[1] || !match[2]) {
    throw new Error(
      `Invalid audit log date range, expected "[YYYY-MM-DD,YYYY-MM-DD)" but got: ${auditLogDateRange}`,
    )
  }
  return { lowerInclusive: match[1], upperExclusive: match[2] }
}

/**
 * Convert a `yyyy-MM` month (interpreted in Singapore time) into the stored
 * daterange string, `[YYYY-MM-DD,YYYY-MM-DD)` over SGT calendar dates.
 *
 * - Past month: the full calendar month, e.g. "2024-03" →
 *   `[2024-03-01,2024-04-01)`.
 * - Current SGT month (the month of `now` in Asia/Singapore): the upper bound
 *   is clamped to SGT-today + 1 day so today's partial day is included. On the
 *   1st this yields `[yyyy-MM-01,yyyy-MM-02)` — never empty.
 *
 * Future months are rejected upstream by zod; `now` is an explicit parameter
 * (no internal clock reads) for testability.
 */
export const getMonthDateRange = (month: IsoMonth, now: Date): string => {
  const [year, monthIndex] = month.split("-").map(Number)
  if (
    year === undefined ||
    monthIndex === undefined ||
    Number.isNaN(year) ||
    Number.isNaN(monthIndex) ||
    monthIndex < 1 ||
    monthIndex > 12
  ) {
    // oxlint-disable-next-line @typescript-eslint/restrict-template-expressions
    throw new Error(`Invalid month, expected "yyyy-MM" but got: ${month}`)
  }

  // A UTC instant mid-month falls inside the target month in every timezone,
  // so we can derive the SGT month start from it without boundary surprises.
  // `toZonedTime` re-labels the instant with SGT wall-clock fields, so the
  // plain date-fns `format`/`startOfMonth`/`addMonths` below all operate on
  // SGT calendar dates regardless of the server timezone.
  const midMonth = new Date(Date.UTC(year, monthIndex - 1, MID_OF_MONTH))
  const monthStart = startOfMonth(toZonedTime(midMonth, SINGAPORE_TIME_ZONE))
  const lowerInclusive = format(monthStart, "yyyy-MM-dd")
  const nextMonthStart = format(addMonths(monthStart, 1), "yyyy-MM-dd")

  // Clamp the upper bound to SGT-today + 1 day so an in-progress month covers
  // up to (and including) today's partial day. For past months the next month
  // start is always the earlier bound, so the clamp is a no-op.
  const sgtToday = toZonedTime(now, SINGAPORE_TIME_ZONE)
  const dayAfterSgtToday = format(addDays(sgtToday, 1), "yyyy-MM-dd")
  const upperExclusive =
    nextMonthStart < dayAfterSgtToday ? nextMonthStart : dayAfterSgtToday

  return formatAuditLogDateRange(lowerInclusive, upperExclusive)
}

/**
 * The UTC instants bounding an export range, half-open: [rangeStart, rangeEnd).
 * Each SGT calendar-date bound of the stored daterange maps to its SGT-midnight
 * instant: the inclusive lower bound becomes `rangeStart` and the exclusive
 * upper bound becomes `rangeEnd`. Singapore has no DST, so SGT midnight is
 * unambiguous.
 */
export const getExportRange = (
  auditLogDateRange: string,
): { rangeStart: Date; rangeEnd: Date } => {
  const { lowerInclusive, upperExclusive } =
    parseAuditLogDateRange(auditLogDateRange)
  return {
    rangeStart: fromZonedTime(lowerInclusive, SINGAPORE_TIME_ZONE),
    rangeEnd: fromZonedTime(upperExclusive, SINGAPORE_TIME_ZONE),
  }
}

/**
 * POINT-IN-TIME access report (ADR docs/adr/0003).
 *
 * Returns who had access to the site **as of the trailing edge of the export
 * range** (the SGT-midnight instant of the daterange's exclusive upper bound),
 * reconstructed from `ResourcePermission` createdAt/deletedAt soft-delete
 * history — NOT who has access now.
 *
 * The export range is half-open `[rangeStart, rangeEnd)`, so the predicates
 * compare directly against the exclusive `rangeEnd` — no "last covered
 * instant" arithmetic. A row is included when it was created strictly inside
 * the range and had not yet been revoked before its trailing edge:
 *   `createdAt < rangeEnd
 *      AND (deletedAt IS NULL OR deletedAt >= rangeEnd)`
 *
 * A permission created exactly at `rangeEnd` belongs to the next range and is
 * excluded; one revoked exactly at `rangeEnd` still covered every instant of
 * this range and is included. (An earlier revision subtracted 1ms to build an
 * inclusive bound, but Postgres timestamps carry microsecond precision, so
 * rows in the final millisecond of the range were misclassified.)
 *
 * For an in-progress range (a current-month export clamped to SGT-today + 1
 * day, whose trailing edge is still in the future) the predicate naturally
 * collapses to "who has access now" — this is intended.
 *
 * Internal Isomer admins (rows in the `IsomerAdmin` table) are excluded,
 * matching the script (PR #2612).
 */
export const getAccessReportRows = async ({
  siteId,
  auditLogDateRange,
}: AuditReportQueryParams): Promise<AccessReportRow[]> => {
  const { rangeEnd } = getExportRange(auditLogDateRange)

  return (
    db
      .selectFrom("ResourcePermission as rp")
      .innerJoin("User as u", "u.id", "rp.userId")
      // Column order matches the original script's CSV (Email, Last login,
      // Role, Date added) so position-based consumers stay stable — `toCsv`
      // emits headers/values in object-insertion order.
      .select([
        "u.email as Email",
        'u.lastLoginAt as "Last login"',
        "rp.role as Role",
        'rp.createdAt as "Date added"',
      ])
      .where("rp.siteId", "=", siteId)
      // Exclude internal Isomer admins from agency-facing reports
      .where("u.id", "not in", (eb) =>
        eb.selectFrom("IsomerAdmin").select("IsomerAdmin.userId"),
      )
      // Point-in-time predicate against the exclusive trailing edge: the
      // permission must have been created inside the range and must not have
      // been revoked before its end.
      .where("rp.createdAt", "<", rangeEnd)
      .where((eb) =>
        eb.or([
          eb("rp.deletedAt", "is", null),
          eb("rp.deletedAt", ">=", rangeEnd),
        ]),
      )
      .execute()
  )
}

// NOTE: Only use these in the context of `getActivityReportRows`; they are
// separated out for type safety to ensure all displayable event types are
// handled. This module is the single source of truth for the audit report
// queries — `prisma/scripts/getAuditLogs.ts` is a thin wrapper over them.
type DisplayableAuditLogEvent = Exclude<
  AuditLogEvent,
  | "UserCreate"
  | "UserUpdate"
  | "UserDelete"
  | "PermissionUpdate"
  | "SchedulePublish"
  | "CancelSchedulePublish"
>

const AUDIT_LOGS_EVENTS_QUERIES: Record<
  DisplayableAuditLogEvent,
  RawBuilder<unknown>
> = {
  ResourceCreate: sql<string>`CONCAT('"', al.delta -> 'after' -> 'resource' ->> 'title', '" (', al.delta -> 'after' -> 'resource' ->> 'type', ' ', al.delta -> 'after' -> 'resource' ->> 'id', ') created')`,
  ResourceUpdate: sql<string>`CONCAT('"', al.delta -> 'before' -> 'resource' ->> 'title', '" (', al.delta -> 'before' -> 'resource' ->> 'type', ' ', al.delta -> 'before' -> 'resource' ->> 'id', ') updated')`,
  ResourceDelete: sql<string>`CONCAT('"', al.delta -> 'before' ->> 'title', '" (', al.delta -> 'before' ->> 'type', ' ', al.delta -> 'before' ->> 'id', ') deleted')`,
  Publish: sql<string>`CONCAT('"', al.metadata ->> 'title', '" (', al.metadata ->> 'type', ' ', al.metadata ->> 'id', ') published to Version No. ', al.delta -> 'after' ->> 'versionNum')`,
  NavbarUpdate: sql<string>`'Navbar has been updated'`,
  FooterUpdate: sql<string>`'Footer has been updated'`,
  SiteConfigUpdate: sql<string>`'Site configuration has been updated'`,
  RedirectCreate: sql<string>`CONCAT('Redirect from "', al.delta -> 'after' ->> 'source', '" to "', al.delta -> 'after' ->> 'destination', '" ', CASE WHEN al.delta -> 'before' ->> 'destination' IS NOT NULL THEN CONCAT('revived (was: "', al.delta -> 'before' ->> 'destination', '")') ELSE 'created' END)`,
  RedirectDelete: sql<string>`CONCAT('Redirect from "', al.delta -> 'before' ->> 'source', '" to "', al.delta -> 'before' ->> 'destination', '" deleted')`,
  PermissionCreate: sql<string>`CONCAT('Permission (', al.delta -> 'after' ->> 'role', ') granted to ', pu.email)`,
  PermissionDelete: sql<string>`CONCAT('Permission (', al.delta -> 'before' ->> 'role', ') revoked from ', pu.email)`,
  Login: sql<string>`CONCAT('Login attempt by ', SPLIT_PART(al.delta -> 'before' ->> 'identifier', '|', 1), ' from IP address ', SPLIT_PART(al.delta -> 'before' ->> 'identifier', '|', 2))`,
  Logout: sql<string>`CONCAT('Logout attempt by ', al.delta -> 'before' ->> 'email', ' from IP address ', al."ipAddress")`,
  // The delta stores the REQUESTED report type (possibly "Both"), so the
  // description reflects the user's ask, not the fanned-out DB rows.
  AuditLogExportCreate: sql<string>`CONCAT('Audit log export requested for ', al.delta -> 'after' ->> 'auditLogDateRange', ' (', al.delta -> 'after' ->> 'reportType', ')')`,
}

// NOTE: As with the access report, string-alias columns keep their quotes in
// the runtime key (e.g. `"Event type"`), while `.as("Description")` /
// `.as("Name")`-style method aliases (and unquoted string aliases like
// `as Email`) produce clean keys. Labels match the script verbatim. The row
// type is inferred from the query (see `ActivityReportRow` below) so it stays
// in lockstep with the select list rather than drifting from a hand-written
// interface.

/**
 * Month-scoped Activity (events) report.
 *
 * Ported from the `"events"` branch of `prisma/scripts/getAuditLogs.ts`: the
 * same event-type CASE → human "Description", the same column labels, and the
 * same `createdAt` ordering. Login/Logout events are gated to ACTIVE
 * collaborator windows (PR #2612): the `collaboratorWindows` CTE reconstructs
 * each collaborator's `[grantedAt, revokedAt)` windows from
 * `ResourcePermission` soft-delete history (restricted to windows overlapping
 * the export range), and a Login/Logout row is included only if its email
 * belonged to a window covering the event's own timestamp. Internal Isomer
 * admins (rows in `IsomerAdmin`) are excluded. Only
 * `siteId`/`auditLogDateRange` are parameterised; the daterange's SGT
 * calendar-date bounds are converted to SGT-midnight instants via
 * `getExportRange`.
 */
export const getActivityReportRows = async ({
  siteId,
  auditLogDateRange,
}: AuditReportQueryParams) => {
  const { rangeStart, rangeEnd } = getExportRange(auditLogDateRange)

  return db
    .with("collaboratorWindows", (eb) =>
      eb
        // One row per collaboration window: granted at `grantedAt`, revoked at
        // `revokedAt` (null while still active), reconstructed from the
        // `ResourcePermission` soft-delete history. Login/Logout events are
        // only included while the user was an active collaborator at the
        // event's own timestamp.
        .selectFrom("ResourcePermission as permission")
        .innerJoin(
          "User as collaboratorUser",
          "collaboratorUser.id",
          "permission.userId",
        )
        .select([
          "collaboratorUser.email",
          "permission.createdAt as grantedAt",
          "permission.deletedAt as revokedAt",
        ])
        .where("permission.siteId", "=", siteId)
        // Exclude internal Isomer admins from agency-facing reports
        .where("collaboratorUser.id", "not in", (ieb) =>
          ieb.selectFrom("IsomerAdmin").select("IsomerAdmin.userId"),
        )
        // Restrict to windows that could overlap the half-open export range
        .where("permission.createdAt", "<", rangeEnd)
        .where((web) =>
          web.or([
            web("permission.deletedAt", "is", null),
            web("permission.deletedAt", ">", rangeStart),
          ]),
        ),
    )
    .selectFrom("AuditLog as al")
    .leftJoin("User as u", "al.userId", "u.id")
    .leftJoin("User as pu", (eb) =>
      eb
        // PermissionCreate carries the target userId under delta.after;
        // PermissionDelete carries it under delta.before (delta.after is
        // NULL). Anchoring only on `after` left `pu` NULL for every
        // PermissionDelete, so `CONCAT(..., pu.email)` rendered the email as
        // an empty string. Resolve from whichever side is populated.
        .onRef(
          "pu.id",
          "=",
          sql<string>`COALESCE(al.delta -> 'after' ->> 'userId', al.delta -> 'before' ->> 'userId')`,
        )
        .on("al.eventType", "in", [
          AuditLogEvent.PermissionCreate,
          AuditLogEvent.PermissionDelete,
        ]),
    )
    .select((eb) => [
      'al.createdAt as "Date and time"',
      'al.eventType as "Event type"',
      eb
        .case()
        // Special cases
        .when(
          eb.and([
            eb("al.eventType", "=", AuditLogEvent.ResourceUpdate),
            sql<boolean>`al.delta -> 'before' ->> 'title' IS NOT NULL`,
          ]),
        )
        .then(
          sql<string>`CONCAT('"', al.delta -> 'before' ->> 'title', '" (', al.delta -> 'before' ->> 'type', ' ', al.delta -> 'before' ->> 'id', ') updated')`,
        )
        .when(
          eb.and([
            eb("al.eventType", "=", AuditLogEvent.Publish),
            sql<boolean>`al.delta ->> 'before' IS NULL`,
            sql<boolean>`al.delta ->> 'after' IS NULL`,
          ]),
        )
        .then("Publish")
        // Ordinary cases
        .when("al.eventType", "=", AuditLogEvent.ResourceCreate)
        .then(AUDIT_LOGS_EVENTS_QUERIES[AuditLogEvent.ResourceCreate])
        .when("al.eventType", "=", AuditLogEvent.ResourceUpdate)
        .then(AUDIT_LOGS_EVENTS_QUERIES[AuditLogEvent.ResourceUpdate])
        .when("al.eventType", "=", AuditLogEvent.ResourceDelete)
        .then(AUDIT_LOGS_EVENTS_QUERIES[AuditLogEvent.ResourceDelete])
        .when("al.eventType", "=", AuditLogEvent.Publish)
        .then(AUDIT_LOGS_EVENTS_QUERIES[AuditLogEvent.Publish])
        .when("al.eventType", "=", AuditLogEvent.NavbarUpdate)
        .then(AUDIT_LOGS_EVENTS_QUERIES[AuditLogEvent.NavbarUpdate])
        .when("al.eventType", "=", AuditLogEvent.FooterUpdate)
        .then(AUDIT_LOGS_EVENTS_QUERIES[AuditLogEvent.FooterUpdate])
        .when("al.eventType", "=", AuditLogEvent.SiteConfigUpdate)
        .then(AUDIT_LOGS_EVENTS_QUERIES[AuditLogEvent.SiteConfigUpdate])
        .when("al.eventType", "=", AuditLogEvent.RedirectCreate)
        .then(AUDIT_LOGS_EVENTS_QUERIES[AuditLogEvent.RedirectCreate])
        .when("al.eventType", "=", AuditLogEvent.RedirectDelete)
        .then(AUDIT_LOGS_EVENTS_QUERIES[AuditLogEvent.RedirectDelete])
        .when("al.eventType", "=", AuditLogEvent.PermissionCreate)
        .then(AUDIT_LOGS_EVENTS_QUERIES[AuditLogEvent.PermissionCreate])
        .when("al.eventType", "=", AuditLogEvent.PermissionDelete)
        .then(AUDIT_LOGS_EVENTS_QUERIES[AuditLogEvent.PermissionDelete])
        .when("al.eventType", "=", AuditLogEvent.Login)
        .then(AUDIT_LOGS_EVENTS_QUERIES[AuditLogEvent.Login])
        .when("al.eventType", "=", AuditLogEvent.Logout)
        .then(AUDIT_LOGS_EVENTS_QUERIES[AuditLogEvent.Logout])
        .when("al.eventType", "=", AuditLogEvent.AuditLogExportCreate)
        .then(AUDIT_LOGS_EVENTS_QUERIES[AuditLogEvent.AuditLogExportCreate])
        .else("-")
        .end()
        .as("Description"),
      "u.name as Name",
      "u.email as Email",
      'u.lastLoginAt as "Last login date"',
      'u.createdAt as "Account creation date"',
      "al.metadata as Metadata",
      "al.delta as Delta",
    ])
    .where((eb) =>
      eb.or([
        eb.and([
          eb(
            "al.eventType",
            "in",
            Object.keys(
              AUDIT_LOGS_EVENTS_QUERIES,
            ) as DisplayableAuditLogEvent[],
          ),
          eb.or([
            eb.eb("al.siteId", "=", siteId),
            eb.eb(
              sql<number>`("al".delta -> 'after' ->> 'siteId')::int`,
              "=",
              siteId,
            ),
          ]),
        ]),
        eb.and([
          eb("al.eventType", "=", AuditLogEvent.Login),
          eb(
            sql<string>`SPLIT_PART(al.delta -> 'before' ->> 'identifier', '|', 1)`,
            "in",
            (fb) =>
              fb
                .selectFrom("collaboratorWindows as cw")
                .select("cw.email")
                // Only while the user was an active collaborator at event time
                .where("cw.grantedAt", "<=", sql<Date>`al."createdAt"`)
                .where((web) =>
                  web.or([
                    web("cw.revokedAt", "is", null),
                    web("cw.revokedAt", ">", sql<Date>`al."createdAt"`),
                  ]),
                ),
          ),
        ]),
        eb.and([
          eb("al.eventType", "=", AuditLogEvent.Logout),
          eb(sql<string>`al.delta -> 'before' ->> 'email'`, "in", (fb) =>
            fb
              .selectFrom("collaboratorWindows as cw")
              .select("cw.email")
              // Only while the user was an active collaborator at event time
              .where("cw.grantedAt", "<=", sql<Date>`al."createdAt"`)
              .where((web) =>
                web.or([
                  web("cw.revokedAt", "is", null),
                  web("cw.revokedAt", ">", sql<Date>`al."createdAt"`),
                ]),
              ),
          ),
        ]),
      ]),
    )
    .where("al.createdAt", ">=", rangeStart)
    .where("al.createdAt", "<", rangeEnd)
    .orderBy("al.createdAt", "asc")
    .execute()
}

// Inferred from the query so the row shape (including the quoted-key columns
// and the `Description` CASE expression) stays exactly in sync with the
// select list.
export type ActivityReportRow = Awaited<
  ReturnType<typeof getActivityReportRows>
>[number]

/**
 * Serialize report rows to CSV. Headers are the object keys (quotes stripped,
 * matching the script). Values are stringified as: `Date` → ISO-8601 in
 * Singapore time with a `+08:00` offset, `null`/`undefined` → empty string,
 * strings verbatim, everything else → JSON. Rendering dates in SGT (rather than
 * the script's UTC `toISOString`) keeps the file coherent with the SGT month it
 * is scoped to and shows timestamps in the auditor's local wall-clock time.
 */
export const getStringifiedValue = (value: unknown): string => {
  if (value === null || value === undefined) {
    return ""
  }
  if (value instanceof Date) {
    return formatInTimeZone(
      value,
      SINGAPORE_TIME_ZONE,
      "yyyy-MM-dd'T'HH:mm:ss.SSSXXX",
    )
  }
  if (typeof value === "string") {
    return value
  }
  return JSON.stringify(value)
}

export const toCsv = (rows: Record<string, unknown>[]): string => {
  return Papa.unparse({
    fields: Object.keys(rows[0] ?? {}).map((key) => key.replaceAll('"', "")),
    data: rows.map((row) =>
      Object.values(row).map((value) => getStringifiedValue(value)),
    ),
  })
}
