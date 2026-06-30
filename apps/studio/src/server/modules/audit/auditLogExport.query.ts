import type { RawBuilder } from "kysely"
import { endOfMonth, startOfMonth } from "date-fns"
import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz"
import Papa from "papaparse"

import { AuditLogEvent, db, sql } from "../database"

// The fixed business timezone for audit months. We convert through date-fns-tz
// (rather than hardcoding the +08:00 offset) so the zone handling is explicit.
const SINGAPORE_TIME_ZONE = "Asia/Singapore"

/**
 * Given a `yyyy-MM` month string, return the UTC `Date` instants for the START
 * and END of that month, interpreting the month as Singapore time.
 *
 * The month is treated as an SGT calendar month: `startOfMonth`/`endOfMonth`
 * find its first and last wall-clock instants in SGT (inclusive `monthEnd` at
 * `23:59:59.999`), which are then converted to UTC.
 *
 * Example: month "2024-03" → monthStart = 2024-02-29T16:00:00.000Z (2024-03-01
 * 00:00 SGT), monthEnd = 2024-03-31T15:59:59.999Z (2024-03-31 23:59:59.999
 * SGT). So an event at 2024-03-31T23:30:00Z is 2024-04-01 07:30 SGT and
 * falls *after* monthEnd — it belongs to April, not March.
 */
export const getSingaporeMonthBoundaries = (
  month: string,
): { monthStart: Date; monthEnd: Date } => {
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

  // Treat the month as Singapore time: express an instant within it as SGT
  // wall-clock, let date-fns find the month's start/end in that wall clock,
  // then convert both boundaries back to UTC instants.
  const zoned = toZonedTime(
    new Date(Date.UTC(year, monthIndex - 1, 1)),
    SINGAPORE_TIME_ZONE,
  )
  const monthStart = fromZonedTime(startOfMonth(zoned), SINGAPORE_TIME_ZONE)
  const monthEnd = fromZonedTime(endOfMonth(zoned), SINGAPORE_TIME_ZONE)

  return { monthStart, monthEnd }
}

export interface AuditReportQueryParams {
  siteId: number
  month: string // in the format of yyyy-MM
}

// NOTE: The string-alias form `as "Date added"` keeps the double-quotes as
// part of the returned column key (Kysely does not strip them), so the
// runtime keys are `"Date added"` / `"Last login"` — quotes included. This
// matches the original script, which relies on `toCsv` stripping the quotes
// from the CSV header. The label text is preserved verbatim.
export interface AccessReportRow {
  Email: string | null
  Role: string
  '"Date added"': Date
  '"Last login"': Date | null
}

/**
 * POINT-IN-TIME access report (ADR docs/adr/0003).
 *
 * Returns who had access to the site **as of the end of the selected month
 * in Singapore time**, reconstructed from `ResourcePermission`
 * createdAt/deletedAt soft-delete history — NOT who has access now.
 *
 * A row is included when it was created on or before `monthEnd` and had not
 * yet been revoked as of `monthEnd`:
 *   `createdAt <= monthEnd AND (deletedAt IS NULL OR deletedAt > monthEnd)`
 *
 * For the current SGT month, `monthEnd` is in the future, so the predicate
 * naturally collapses to "who has access now" — this is intended.
 *
 * Isomer team members (`@open.gov.sg`) are excluded, matching the script.
 */
export const getAccessReportRows = async ({
  siteId,
  month,
}: AuditReportQueryParams): Promise<AccessReportRow[]> => {
  const { monthEnd } = getSingaporeMonthBoundaries(month)

  return (
    db
      .selectFrom("ResourcePermission as rp")
      .innerJoin("User as u", "u.id", "rp.userId")
      .select([
        "u.email as Email",
        "rp.role as Role",
        'rp.createdAt as "Date added"',
        'u.lastLoginAt as "Last login"',
      ])
      .where("rp.siteId", "=", siteId)
      .where("u.email", "not like", "%@open.gov.sg")
      // Point-in-time predicate: permission must already exist as of monthEnd,
      // and must not have been revoked on or before monthEnd.
      .where("rp.createdAt", "<=", monthEnd)
      .where((eb) =>
        eb.or([
          eb("rp.deletedAt", "is", null),
          eb("rp.deletedAt", ">", monthEnd),
        ]),
      )
      .execute()
  )
}

// NOTE: Only use these in the context of `getActivityReportRows`; they are
// separated out for type safety to ensure all displayable event types are
// handled. Ported verbatim from `prisma/scripts/getAuditLogs.ts`.
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
 * Ported faithfully from the `"events"` branch of
 * `prisma/scripts/getAuditLogs.ts`: the same CTEs, the same event-type CASE
 * → human "Description", the same Login/Logout email filtering against
 * `emailsFromUsers`/`emailsFromPermissionChanges` (which excludes
 * `@open.gov.sg`), the same column labels, and the same `createdAt` ordering.
 * Only `siteId`/`month` are parameterised and the boundaries are computed in
 * Singapore time.
 */
export const getActivityReportRows = async ({
  siteId,
  month,
}: AuditReportQueryParams) => {
  const { monthStart, monthEnd } = getSingaporeMonthBoundaries(month)

  return db
    .with("emailsFromPermissionChanges", (eb) =>
      eb
        .selectFrom("AuditLog")
        .select((fb) => [
          fb
            .case()
            .when("AuditLog.eventType", "=", AuditLogEvent.PermissionCreate)
            .then(sql<string>`"AuditLog".delta -> 'after' ->> 'userId'`)
            .else(
              fb.fn<string>("coalesce", [
                sql<string>`"AuditLog".delta -> 'before' ->> 'userId'`,
                sql<string>`"AuditLog".delta -> 'after' ->> 'userId'`,
              ]),
            )
            .end()
            .as("email"),
        ])
        .where("AuditLog.eventType", "in", [
          AuditLogEvent.PermissionCreate,
          AuditLogEvent.PermissionDelete,
        ])
        .where("AuditLog.siteId", "=", siteId)
        .where("AuditLog.createdAt", ">=", monthStart)
        .where("AuditLog.createdAt", "<=", monthEnd),
    )
    .with("emailsFromUsers", (eb) =>
      eb
        .selectFrom("User")
        .select(["User.email", "User.id"])
        .where("User.email", "not like", "%@open.gov.sg")
        .where("User.id", "in", (fb) =>
          fb
            .selectFrom("ResourcePermission")
            .select("ResourcePermission.userId")
            .where("ResourcePermission.siteId", "=", siteId),
        ),
    )
    .selectFrom("AuditLog as al")
    .leftJoin("User as u", "al.userId", "u.id")
    .leftJoin("User as pu", (eb) =>
      eb
        .onRef("pu.id", "=", sql<string>`al.delta -> 'after' ->> 'userId'`)
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
        .when("al.eventType", "=", AuditLogEvent.PermissionCreate)
        .then(AUDIT_LOGS_EVENTS_QUERIES[AuditLogEvent.PermissionCreate])
        .when("al.eventType", "=", AuditLogEvent.PermissionDelete)
        .then(AUDIT_LOGS_EVENTS_QUERIES[AuditLogEvent.PermissionDelete])
        .when("al.eventType", "=", AuditLogEvent.Login)
        .then(AUDIT_LOGS_EVENTS_QUERIES[AuditLogEvent.Login])
        .when("al.eventType", "=", AuditLogEvent.Logout)
        .then(AUDIT_LOGS_EVENTS_QUERIES[AuditLogEvent.Logout])
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
            eb.eb(sql<number>`"al".delta -> 'after' ->> 'siteId'`, "=", siteId),
          ]),
        ]),
        eb.and([
          eb("al.eventType", "=", AuditLogEvent.Login),
          eb(
            sql<string>`SPLIT_PART(al.delta -> 'before' ->> 'identifier', '|', 1)`,
            "in",
            (fb) =>
              fb
                .selectFrom("emailsFromUsers")
                .select("emailsFromUsers.email")
                .union(
                  fb
                    .selectFrom("emailsFromPermissionChanges")
                    .select("emailsFromPermissionChanges.email"),
                ),
          ),
        ]),
        eb.and([
          eb("al.eventType", "=", AuditLogEvent.Logout),
          eb(sql<string>`al.delta -> 'before' ->> 'email'`, "in", (fb) =>
            fb
              .selectFrom("emailsFromUsers")
              .select("emailsFromUsers.email")
              .union(
                fb
                  .selectFrom("emailsFromPermissionChanges")
                  .select("emailsFromPermissionChanges.email"),
              ),
          ),
        ]),
      ]),
    )
    .where("al.createdAt", ">=", monthStart)
    .where("al.createdAt", "<=", monthEnd)
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
