import fs from "fs"
import path, { dirname } from "path"
import { fileURLToPath } from "url"
import type { RawBuilder } from "kysely"
import { endOfMonth, format, parse, startOfMonth, subMonths } from "date-fns"

import { AuditLogEvent, db, sql } from "~/server/modules/database"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Sites requiring audit logs
const SITES_WITH_AUDIT_LOGS = [
  1, // stb.gov.sg
  41, // ssg.gov.sg
  46, // sportsingapore.gov.sg
  48, // muis.gov.sg
  50, // knowledgehub.clc.gov.sg
  53, // clc.gov.sg
  61, // ipos.gov.sg
  109, // agc.gov.sg
  145, // ite.edu.sg
  166, // mti.gov.sg
]

// Month and year to get audit logs for, in the format of YYYY-MM,
// leave empty for previous month
const MONTH_YEAR = ""

interface GetAuditLogsQueryParams {
  siteId: number
  type: "users" | "events"
  monthYear: string // in the format of YYYY-MM
}

type DisplayableAuditLogEvent = Exclude<
  AuditLogEvent,
  | "UserCreate"
  | "UserUpdate"
  | "UserDelete"
  | "PermissionUpdate"
  | "SchedulePublish"
  | "CancelSchedulePublish"
>

// NOTE: Only use these queries in the context of the getAuditLogQuery function,
// they are separated out for type safety to ensure all event types are handled
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
  PermissionCreate: sql<string>`CONCAT('Permission (', al.delta -> 'after' ->> 'role', ') granted to ', pu.email)`,
  PermissionDelete: sql<string>`CONCAT('Permission (', al.delta -> 'before' ->> 'role', ') revoked from ', pu.email)`,
  Login: sql<string>`CONCAT('Login attempt by ', SPLIT_PART(al.delta -> 'before' ->> 'identifier', '|', 1), ' from IP address ', SPLIT_PART(al.delta -> 'before' ->> 'identifier', '|', 2))`,
  Logout: sql<string>`CONCAT('Logout attempt by ', al.delta -> 'before' ->> 'email', ' from IP address ', al."ipAddress")`,
}

const getAuditLogQuery = ({
  siteId,
  type,
  monthYear,
}: GetAuditLogsQueryParams) => {
  // Parse the date from the given monthYear
  const date = parse(monthYear, "yyyy-MM", new Date())
  const startDate = startOfMonth(date)
  const endDate = endOfMonth(date)

  switch (type) {
    case "users":
      return db
        .selectFrom("User as u")
        .innerJoin("ResourcePermission as rp", "u.id", "rp.userId")
        .select([
          "u.email as Email",
          'u.lastLoginAt as "Last login"',
          "rp.role as Role",
          'rp.createdAt as "Date added"',
        ])
        .where("rp.siteId", "=", siteId)
        .where("u.email", "not like", "%@open.gov.sg")
        .where("rp.deletedAt", "is", null)
    case "events":
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
            .where("AuditLog.createdAt", ">=", startDate)
            .where("AuditLog.createdAt", "<=", endDate),
        )
        .with("emailsFromUsers", (eb) =>
          eb
            .selectFrom("User")
            .select("User.email")
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
              eb("al.siteId", "=", siteId),
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
              eb("al.userId", "in", (fb) =>
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
        .where("al.createdAt", ">=", startDate)
        .where("al.createdAt", "<=", endDate)
        .orderBy("al.createdAt", "asc")
    default:
      const _: never = type
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      throw new Error(`Unknown type: ${type}`)
  }
}

const getStringifiedValue = (value: unknown) => {
  if (value === null || value === undefined) {
    return '""'
  }
  if (value instanceof Date) {
    return `"${value.toISOString()}"`
  }
  if (typeof value === "string") {
    return `"${value.replace(/"/g, '""')}"`
  }
  return `"${JSON.stringify(value).replace(/"/g, '""')}"`
}

const getAuditLogsForSite = async () => {
  // If MONTH_YEAR is provided, use that, else get the previous month from today
  const now = new Date()
  const previousMonth = subMonths(now, 1)
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const monthYear = MONTH_YEAR ? MONTH_YEAR : format(previousMonth, "yyyy-MM")

  for (const siteId of SITES_WITH_AUDIT_LOGS) {
    console.log(`Getting audit logs for siteId: ${siteId}`)

    // Get users
    const users = await getAuditLogQuery({
      siteId,
      type: "users",
      monthYear,
    }).execute()

    // Get events from the previous month
    const events = await getAuditLogQuery({
      siteId,
      type: "events",
      monthYear,
    }).execute()

    // Save as CSV files
    const usersFilename = `useraccess_${siteId}_${monthYear}.csv`
    const eventsFilename = `auditlogs_${siteId}_${monthYear}.csv`

    const usersCsv = [
      Object.keys(users[0] ?? {}).join(","),
      ...users.map((row) =>
        Object.values(row)
          .map((value) => getStringifiedValue(value))
          .join(","),
      ),
    ].join("\n")

    const eventsCsv = [
      Object.keys(events[0] ?? {}).join(","),
      ...events.map((row) =>
        Object.values(row)
          .map((value) => getStringifiedValue(value))
          .join(","),
      ),
    ].join("\n")

    const outputDir = path.join(__dirname, "output")
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir)
    }

    fs.writeFileSync(path.join(outputDir, usersFilename), usersCsv)
    fs.writeFileSync(path.join(outputDir, eventsFilename), eventsCsv)
  }

  console.log('All audit logs saved in "output" folder')
}

await getAuditLogsForSite()
