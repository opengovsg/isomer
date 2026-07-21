import type { IsoMonth } from "~/schemas/audit"
import { resetTables } from "tests/integration/helpers/db"
import {
  setupIsomerAdmin,
  setupSite,
  setupUser,
} from "tests/integration/helpers/seed"
import { beforeEach, describe, expect, it } from "vitest"

import { AuditLogEvent, db, jsonb, RoleType } from "../../database"
import {
  formatAuditLogDateRange,
  getAccessReportRows,
  getActivityReportRows,
  getExportRange,
  getMonthDateRange,
  getStringifiedValue,
  parseAuditLogDateRange,
  toCsv,
} from "../auditLogExport.query"

// A non-future, deterministic month literal used throughout, plus its stored
// daterange representation (canonical `[YYYY-MM-DD,YYYY-MM-DD)` over SGT
// calendar dates). `NOW` is fixed well after the month so the range is the
// full calendar month (no current-month clamping).
const MONTH = "2024-03"
const NOW = new Date("2026-07-15T04:00:00Z")
const auditLogDateRange = getMonthDateRange(MONTH, NOW)

const setupPermission = async ({
  userId,
  siteId,
  role = RoleType.Editor,
  createdAt,
  deletedAt = null,
}: {
  userId: string
  siteId: number
  role?: (typeof RoleType)[keyof typeof RoleType]
  createdAt: Date
  deletedAt?: Date | null
}) => {
  return db
    .insertInto("ResourcePermission")
    .values({
      userId,
      siteId,
      role,
      resourceId: null,
      createdAt,
      updatedAt: createdAt,
      deletedAt,
    })
    .returningAll()
    .executeTakeFirstOrThrow()
}

const insertAuditLog = async ({
  eventType,
  userId,
  siteId,
  delta,
  metadata = {},
  ipAddress = "1.2.3.4",
  createdAt,
}: {
  eventType: AuditLogEvent
  userId: string
  siteId: number | null
  delta: unknown
  metadata?: Record<string, unknown>
  ipAddress?: string | null
  createdAt: Date
}) => {
  return db
    .insertInto("AuditLog")
    .values({
      eventType,
      userId,
      siteId,
      // delta/metadata are jsonb columns
      delta: jsonb(delta) as never,
      metadata: jsonb(metadata),
      ipAddress,
      createdAt,
      updatedAt: createdAt,
    })
    .returningAll()
    .executeTakeFirstOrThrow()
}

describe("auditLogExport.query", () => {
  beforeEach(async () => {
    await resetTables(
      "AuditLog",
      "ResourcePermission",
      "IsomerAdmin",
      "User",
      "Site",
    )
  })

  describe("formatAuditLogDateRange / parseAuditLogDateRange", () => {
    it("round-trips SGT calendar-date bounds through the canonical form", () => {
      const range = formatAuditLogDateRange("2026-04-01", "2026-05-01")
      expect(range).toBe("[2026-04-01,2026-05-01)")
      expect(parseAuditLogDateRange(range)).toEqual({
        lowerInclusive: "2026-04-01",
        upperExclusive: "2026-05-01",
      })
    })

    it("rejects non-canonical input", () => {
      expect(() => parseAuditLogDateRange("")).toThrow()
      expect(() => parseAuditLogDateRange("garbage")).toThrow()
      // Missing brackets
      expect(() => parseAuditLogDateRange("2026-04-01,2026-05-01")).toThrow()
      // Wrong bound inclusivity — Postgres canonicalises to `[...)`
      expect(() => parseAuditLogDateRange("(2026-04-01,2026-05-01)")).toThrow()
      expect(() => parseAuditLogDateRange("[2026-04-01,2026-05-01]")).toThrow()
      // Unpadded dates are not canonical
      expect(() => parseAuditLogDateRange("[2026-4-1,2026-05-01)")).toThrow()
      // Unbounded ranges are excluded by the DB CHECK
      expect(() => parseAuditLogDateRange("[2026-04-01,)")).toThrow()
      expect(() => parseAuditLogDateRange("[,2026-05-01)")).toThrow()
      expect(() => parseAuditLogDateRange("empty")).toThrow()
    })
  })

  describe("getMonthDateRange", () => {
    it("returns the full calendar month for a past month", () => {
      expect(getMonthDateRange("2026-04", NOW)).toBe("[2026-04-01,2026-05-01)")
      expect(getMonthDateRange(MONTH, NOW)).toBe("[2024-03-01,2024-04-01)")
    })

    it("rolls over the year for December and covers leap February", () => {
      expect(getMonthDateRange("2024-12", NOW)).toBe("[2024-12-01,2025-01-01)")
      // Leap-year February: upper bound is Mar 1, covering all 29 days.
      expect(getMonthDateRange("2024-02", NOW)).toBe("[2024-02-01,2024-03-01)")
    })

    it("clamps the current SGT month to SGT-today + 1 day", () => {
      // 2026-07-16 10:00 SGT → upper bound is the 17th (today's partial day
      // is included).
      expect(
        getMonthDateRange("2026-07", new Date("2026-07-16T02:00:00Z")),
      ).toBe("[2026-07-01,2026-07-17)")
      // The SGT date — not the UTC date — decides "today":
      // 2026-07-15T17:00Z is already 2026-07-16 01:00 SGT.
      expect(
        getMonthDateRange("2026-07", new Date("2026-07-15T17:00:00Z")),
      ).toBe("[2026-07-01,2026-07-17)")
    })

    it("yields a non-empty range on the 1st of the current SGT month", () => {
      // 2026-07-01 10:00 SGT
      expect(
        getMonthDateRange("2026-07", new Date("2026-07-01T02:00:00Z")),
      ).toBe("[2026-07-01,2026-07-02)")
      // 2026-06-30T18:00Z is already 2026-07-01 02:00 SGT.
      expect(
        getMonthDateRange("2026-07", new Date("2026-06-30T18:00:00Z")),
      ).toBe("[2026-07-01,2026-07-02)")
    })

    it("does not clamp on the last SGT day of the current month", () => {
      // 2026-07-31 10:00 SGT → SGT-today + 1 === next month start, so the
      // range is the full month.
      expect(
        getMonthDateRange("2026-07", new Date("2026-07-31T02:00:00Z")),
      ).toBe("[2026-07-01,2026-08-01)")
    })

    it("rejects a malformed month", () => {
      // Casts bypass the `IsoMonth` compile-time guard on purpose: these
      // exercise the runtime defense for values arriving through untyped
      // paths (e.g. raw DB reads or JSON).
      expect(() => getMonthDateRange("2024-13" as IsoMonth, NOW)).toThrow()
      expect(() => getMonthDateRange("not-a-month" as IsoMonth, NOW)).toThrow()
    })
  })

  describe("getExportRange", () => {
    it("maps the SGT calendar-date bounds to SGT-midnight UTC instants", () => {
      const { rangeStart, rangeEnd } = getExportRange("[2024-03-01,2024-04-01)")
      // 2024-03-01 00:00 SGT === 2024-02-29 16:00 UTC
      expect(rangeStart.toISOString()).toBe("2024-02-29T16:00:00.000Z")
      // 2024-04-01 00:00 SGT === 2024-03-31 16:00 UTC
      expect(rangeEnd.toISOString()).toBe("2024-03-31T16:00:00.000Z")
    })

    it("throws on a non-canonical range", () => {
      expect(() => getExportRange("2024-03-01/2024-04-01")).toThrow()
    })
  })

  describe("getAccessReportRows (point-in-time)", () => {
    it("reconstructs who had access as of the end of the selected month", async () => {
      const { site } = await setupSite()

      // Created Feb 2024, still active → INCLUDED
      const activeUser = await setupUser({ email: "active@agency.gov.sg" })
      await setupPermission({
        userId: activeUser.id,
        siteId: site.id,
        createdAt: new Date("2024-02-15T00:00:00Z"),
      })

      // Created Apr 2024 (after month end) → EXCLUDED
      const futureUser = await setupUser({ email: "future@agency.gov.sg" })
      await setupPermission({
        userId: futureUser.id,
        siteId: site.id,
        createdAt: new Date("2024-04-01T00:00:00Z"),
      })

      // Created Jan 2024, revoked Feb 2024 (before month end) → EXCLUDED
      const revokedEarlyUser = await setupUser({
        email: "revoked-early@agency.gov.sg",
      })
      await setupPermission({
        userId: revokedEarlyUser.id,
        siteId: site.id,
        createdAt: new Date("2024-01-10T00:00:00Z"),
        deletedAt: new Date("2024-02-20T00:00:00Z"),
      })

      // Created Jan 2024, revoked May 2024 (after month end) → INCLUDED
      // (they had access during March)
      const revokedLateUser = await setupUser({
        email: "revoked-late@agency.gov.sg",
      })
      await setupPermission({
        userId: revokedLateUser.id,
        siteId: site.id,
        createdAt: new Date("2024-01-10T00:00:00Z"),
        deletedAt: new Date("2024-05-10T00:00:00Z"),
      })

      // Created Jan 2024, revoked just inside the range's trailing edge
      // (deletedAt === rangeEnd - 1ms === 2024-03-31T15:59:59.999Z, i.e.
      // 2024-03-31 23:59:59.999 SGT) → EXCLUDED: `deletedAt >= rangeEnd`
      // fails, so the user no longer had access at the end of the range.
      const revokedAtBoundaryUser = await setupUser({
        email: "revoked-at-boundary@agency.gov.sg",
      })
      await setupPermission({
        userId: revokedAtBoundaryUser.id,
        siteId: site.id,
        createdAt: new Date("2024-01-10T00:00:00Z"),
        deletedAt: new Date("2024-03-31T15:59:59.999Z"),
      })

      const rows = await getAccessReportRows({
        siteId: site.id,
        auditLogDateRange,
      })
      const emails = rows.map((r) => r.Email).sort()

      expect(emails).toEqual([
        "active@agency.gov.sg",
        "revoked-late@agency.gov.sg",
      ])
    })

    // Semantic change (ported from main, PR #2612): internal-team exclusion is
    // by membership in the `IsomerAdmin` table, not by an `@open.gov.sg` email
    // suffix — an @open.gov.sg address alone no longer excludes a user.
    it("excludes Isomer admins even if they hold a permission", async () => {
      const { site } = await setupSite()

      const isomerAdmin = await setupUser({ email: "teammate@open.gov.sg" })
      await setupIsomerAdmin({ userId: isomerAdmin.id })
      await setupPermission({
        userId: isomerAdmin.id,
        siteId: site.id,
        createdAt: new Date("2024-02-01T00:00:00Z"),
      })

      const agencyUser = await setupUser({ email: "agency@agency.gov.sg" })
      await setupPermission({
        userId: agencyUser.id,
        siteId: site.id,
        createdAt: new Date("2024-02-01T00:00:00Z"),
      })

      const rows = await getAccessReportRows({
        siteId: site.id,
        auditLogDateRange,
      })
      expect(rows.map((r) => r.Email)).toEqual(["agency@agency.gov.sg"])
    })

    it("excludes users permissioned only on a different site", async () => {
      const { site } = await setupSite()
      const { site: otherSite } = await setupSite()

      const otherUser = await setupUser({ email: "other@agency.gov.sg" })
      await setupPermission({
        userId: otherUser.id,
        siteId: otherSite.id,
        createdAt: new Date("2024-02-01T00:00:00Z"),
      })

      const rows = await getAccessReportRows({
        siteId: site.id,
        auditLogDateRange,
      })
      expect(rows).toHaveLength(0)
    })

    it("buckets the boundary by SGT, not UTC", async () => {
      const { site } = await setupSite()

      // 2024-03-31T23:30:00Z === 2024-04-01 07:30 SGT → belongs to April,
      // so a permission created at that instant is AFTER March's monthEnd
      // and must be EXCLUDED from the March report.
      const boundaryUser = await setupUser({ email: "boundary@agency.gov.sg" })
      await setupPermission({
        userId: boundaryUser.id,
        siteId: site.id,
        createdAt: new Date("2024-03-31T23:30:00Z"),
      })

      // A permission created just before the SGT month end is INCLUDED.
      // 2024-03-31T15:00:00Z === 2024-03-31 23:00 SGT.
      const inMonthUser = await setupUser({ email: "in-month@agency.gov.sg" })
      await setupPermission({
        userId: inMonthUser.id,
        siteId: site.id,
        createdAt: new Date("2024-03-31T15:00:00Z"),
      })

      // A permission revoked just inside the range's trailing edge
      // (deletedAt === rangeEnd - 1ms === 2024-03-31T15:59:59.999Z) is
      // EXCLUDED: `deletedAt >= rangeEnd` fails.
      const revokedAtBoundaryUser = await setupUser({
        email: "revoked-at-boundary@agency.gov.sg",
      })
      await setupPermission({
        userId: revokedAtBoundaryUser.id,
        siteId: site.id,
        createdAt: new Date("2024-02-01T00:00:00Z"),
        deletedAt: new Date("2024-03-31T15:59:59.999Z"),
      })

      // A permission revoked at the exclusive boundary (rangeEnd ===
      // 2024-03-31T16:00:00.000Z) still covered the last instant of the range
      // and is INCLUDED.
      const revokedAfterBoundaryUser = await setupUser({
        email: "revoked-after-boundary@agency.gov.sg",
      })
      await setupPermission({
        userId: revokedAfterBoundaryUser.id,
        siteId: site.id,
        createdAt: new Date("2024-02-01T00:00:00Z"),
        deletedAt: new Date("2024-03-31T16:00:00.000Z"),
      })

      const rows = await getAccessReportRows({
        siteId: site.id,
        auditLogDateRange,
      })
      expect(rows.map((r) => r.Email).sort()).toEqual([
        "in-month@agency.gov.sg",
        "revoked-after-boundary@agency.gov.sg",
      ])
    })

    it("returns the script's column labels and shape", async () => {
      const { site } = await setupSite()
      const createdAt = new Date("2024-02-15T00:00:00Z")
      const lastLoginAt = new Date("2024-02-20T00:00:00Z")
      const user = await setupUser({
        email: "shape@agency.gov.sg",
        lastLoginAt,
      })
      await setupPermission({
        userId: user.id,
        siteId: site.id,
        role: RoleType.Admin,
        createdAt,
      })

      const rows = await getAccessReportRows({
        siteId: site.id,
        auditLogDateRange,
      })
      expect(rows).toHaveLength(1)
      // String-alias columns keep their quotes in the key (matches the
      // script; `toCsv` strips them for the CSV header).
      expect(rows[0]).toEqual({
        Email: "shape@agency.gov.sg",
        '"Last login"': lastLoginAt,
        Role: RoleType.Admin,
        '"Date added"': createdAt,
      })
      // Column order must match the script's CSV (Email, Last login, Role,
      // Date added) since `toCsv` serializes by insertion order.
      expect(Object.keys(rows[0] ?? {})).toEqual([
        "Email",
        '"Last login"',
        "Role",
        '"Date added"',
      ])
    })
  })

  describe("getActivityReportRows (month-scoped events)", () => {
    it("includes in-month events with a non-empty Description and excludes out-of-month events", async () => {
      const { site } = await setupSite()
      const user = await setupUser({ email: "editor@agency.gov.sg" })

      // In-month Publish (reads metadata ->> 'title'/'type'/'id')
      await insertAuditLog({
        eventType: AuditLogEvent.Publish,
        userId: user.id,
        siteId: site.id,
        delta: { before: { versionNum: 0 }, after: { versionNum: 1 } },
        metadata: { title: "Homepage", type: "Page", id: "42" },
        createdAt: new Date("2024-03-10T02:00:00Z"),
      })

      // In-month ResourceCreate (reads delta -> after -> resource)
      await insertAuditLog({
        eventType: AuditLogEvent.ResourceCreate,
        userId: user.id,
        siteId: site.id,
        delta: {
          before: null,
          after: {
            resource: { title: "About Us", type: "Page", id: "43" },
          },
        },
        createdAt: new Date("2024-03-11T02:00:00Z"),
      })

      // Out-of-month event (Feb) → EXCLUDED
      await insertAuditLog({
        eventType: AuditLogEvent.ResourceCreate,
        userId: user.id,
        siteId: site.id,
        delta: {
          before: null,
          after: {
            resource: { title: "Old Page", type: "Page", id: "1" },
          },
        },
        createdAt: new Date("2024-02-15T02:00:00Z"),
      })

      const rows = await getActivityReportRows({
        siteId: site.id,
        auditLogDateRange,
      })

      expect(rows).toHaveLength(2)
      // ordered by createdAt asc → Publish first, then ResourceCreate
      expect(rows[0]?.['"Event type"']).toBe(AuditLogEvent.Publish)
      expect(rows[0]?.Description).toBe(
        '"Homepage" (Page 42) published to Version No. 1',
      )
      expect(rows[1]?.['"Event type"']).toBe(AuditLogEvent.ResourceCreate)
      expect(rows[1]?.Description).toBe('"About Us" (Page 43) created')
      rows.forEach((row) => {
        expect(row.Description).not.toBe("")
        expect(row.Description).not.toBe("-")
      })
    })

    it("buckets a boundary event by SGT, not UTC", async () => {
      const { site } = await setupSite()
      const user = await setupUser({ email: "editor@agency.gov.sg" })

      // 2024-03-31T23:30:00Z === 2024-04-01 07:30 SGT → April, EXCLUDED from March
      await insertAuditLog({
        eventType: AuditLogEvent.ResourceCreate,
        userId: user.id,
        siteId: site.id,
        delta: {
          before: null,
          after: { resource: { title: "April Page", type: "Page", id: "99" } },
        },
        createdAt: new Date("2024-03-31T23:30:00Z"),
      })

      // 2024-03-31T15:00:00Z === 2024-03-31 23:00 SGT → still March, INCLUDED
      await insertAuditLog({
        eventType: AuditLogEvent.ResourceCreate,
        userId: user.id,
        siteId: site.id,
        delta: {
          before: null,
          after: { resource: { title: "March Page", type: "Page", id: "98" } },
        },
        createdAt: new Date("2024-03-31T15:00:00Z"),
      })

      const rows = await getActivityReportRows({
        siteId: site.id,
        auditLogDateRange,
      })
      expect(rows).toHaveLength(1)
      expect(rows[0]?.Description).toBe('"March Page" (Page 98) created')
    })

    it("includes a legacy event whose siteId lives only under delta.after (numeric-cast fallback)", async () => {
      const { site } = await setupSite()
      const user = await setupUser({ email: "editor@agency.gov.sg" })

      // Legacy row: top-level siteId is NULL, and the site association lives
      // only under delta.after.siteId. The fallback predicate extracts that
      // JSON value as text and must cast it to int before comparing to the
      // numeric siteId — otherwise Postgres raises `operator does not exist:
      // text = integer` and the whole export query throws.
      await insertAuditLog({
        eventType: AuditLogEvent.ResourceCreate,
        userId: user.id,
        siteId: null,
        delta: {
          before: null,
          after: {
            siteId: site.id,
            resource: { title: "Legacy Page", type: "Page", id: "77" },
          },
        },
        createdAt: new Date("2024-03-12T02:00:00Z"),
      })

      const rows = await getActivityReportRows({
        siteId: site.id,
        auditLogDateRange,
      })

      expect(rows).toHaveLength(1)
      expect(rows[0]?.['"Event type"']).toBe(AuditLogEvent.ResourceCreate)
      expect(rows[0]?.Description).toBe('"Legacy Page" (Page 77) created')
    })

    it("renders the target email for a PermissionDelete (userId under delta.before)", async () => {
      const { site } = await setupSite()
      const actor = await setupUser({ email: "admin@agency.gov.sg" })
      const target = await setupUser({ email: "revoked@agency.gov.sg" })

      // PermissionDelete stores the affected user's id under delta.before
      // (delta.after is null). The `pu` join must resolve the email from the
      // `before` side, otherwise the description drops the email entirely.
      await insertAuditLog({
        eventType: AuditLogEvent.PermissionDelete,
        userId: actor.id,
        siteId: site.id,
        delta: {
          before: { userId: target.id, role: RoleType.Editor },
          after: null,
        },
        createdAt: new Date("2024-03-12T02:00:00Z"),
      })

      const rows = await getActivityReportRows({
        siteId: site.id,
        auditLogDateRange,
      })

      const deleteRows = rows.filter(
        (r) => r['"Event type"'] === AuditLogEvent.PermissionDelete,
      )
      expect(deleteRows).toHaveLength(1)
      expect(deleteRows[0]?.Description).toBe(
        `Permission (${RoleType.Editor}) revoked from revoked@agency.gov.sg`,
      )
    })

    it("renders the target email for a PermissionCreate (userId under delta.after)", async () => {
      const { site } = await setupSite()
      const actor = await setupUser({ email: "admin@agency.gov.sg" })
      const target = await setupUser({ email: "granted@agency.gov.sg" })

      await insertAuditLog({
        eventType: AuditLogEvent.PermissionCreate,
        userId: actor.id,
        siteId: site.id,
        delta: {
          before: null,
          after: { userId: target.id, role: RoleType.Editor },
        },
        createdAt: new Date("2024-03-13T02:00:00Z"),
      })

      const rows = await getActivityReportRows({
        siteId: site.id,
        auditLogDateRange,
      })

      const createRows = rows.filter(
        (r) => r['"Event type"'] === AuditLogEvent.PermissionCreate,
      )
      expect(createRows).toHaveLength(1)
      expect(createRows[0]?.Description).toBe(
        `Permission (${RoleType.Editor}) granted to granted@agency.gov.sg`,
      )
    })

    // Semantic change (ported from main, PR #2612): internal-team exclusion is
    // by membership in the `IsomerAdmin` table, not by an `@open.gov.sg` email
    // suffix.
    it("excludes Login events by Isomer admins", async () => {
      const { site } = await setupSite()

      // Agency user with a permission → their Login is INCLUDED
      const agencyUser = await setupUser({ email: "agency@agency.gov.sg" })
      await setupPermission({
        userId: agencyUser.id,
        siteId: site.id,
        createdAt: new Date("2024-02-01T00:00:00Z"),
      })

      // Isomer admin → excluded from collaboratorWindows, Login NOT shown
      // even though they hold a permission on the site
      const isomerUser = await setupUser({ email: "teammate@open.gov.sg" })
      await setupIsomerAdmin({ userId: isomerUser.id })
      await setupPermission({
        userId: isomerUser.id,
        siteId: site.id,
        createdAt: new Date("2024-02-01T00:00:00Z"),
      })

      // Login identifier format is `email|ip`; Login events have siteId null.
      await insertAuditLog({
        eventType: AuditLogEvent.Login,
        userId: agencyUser.id,
        siteId: null,
        delta: {
          before: { identifier: "agency@agency.gov.sg|10.0.0.1" },
          after: null,
        },
        createdAt: new Date("2024-03-05T02:00:00Z"),
      })
      await insertAuditLog({
        eventType: AuditLogEvent.Login,
        userId: isomerUser.id,
        siteId: null,
        delta: {
          before: { identifier: "teammate@open.gov.sg|10.0.0.2" },
          after: null,
        },
        createdAt: new Date("2024-03-06T02:00:00Z"),
      })

      const rows = await getActivityReportRows({
        siteId: site.id,
        auditLogDateRange,
      })

      const loginRows = rows.filter(
        (r) => r['"Event type"'] === AuditLogEvent.Login,
      )
      expect(loginRows).toHaveLength(1)
      expect(loginRows[0]?.Description).toBe(
        "Login attempt by agency@agency.gov.sg from IP address 10.0.0.1",
      )
    })

    it("excludes Login events for users whose permission did not overlap the range", async () => {
      const { site } = await setupSite()

      // Permission granted AFTER the range (Apr 2024) → not active during
      // March, so this user's Login must be EXCLUDED.
      const futureUser = await setupUser({ email: "future@agency.gov.sg" })
      await setupPermission({
        userId: futureUser.id,
        siteId: site.id,
        createdAt: new Date("2024-04-01T00:00:00Z"),
      })

      // Permission revoked BEFORE the range began (deletedAt in Feb, before
      // rangeStart === 2024-03-01 00:00 SGT) → EXCLUDED.
      const revokedBeforeUser = await setupUser({
        email: "revoked-before@agency.gov.sg",
      })
      await setupPermission({
        userId: revokedBeforeUser.id,
        siteId: site.id,
        createdAt: new Date("2024-01-01T00:00:00Z"),
        deletedAt: new Date("2024-02-10T00:00:00Z"),
      })

      // Permission active throughout March → INCLUDED (control).
      const activeUser = await setupUser({ email: "active@agency.gov.sg" })
      await setupPermission({
        userId: activeUser.id,
        siteId: site.id,
        createdAt: new Date("2024-02-01T00:00:00Z"),
      })

      for (const [email, at] of [
        ["future@agency.gov.sg", "2024-03-05T02:00:00Z"],
        ["revoked-before@agency.gov.sg", "2024-03-06T02:00:00Z"],
        ["active@agency.gov.sg", "2024-03-07T02:00:00Z"],
      ] as const) {
        await insertAuditLog({
          eventType: AuditLogEvent.Login,
          userId: activeUser.id,
          siteId: null,
          delta: { before: { identifier: `${email}|10.0.0.1` }, after: null },
          createdAt: new Date(at),
        })
      }

      const rows = await getActivityReportRows({
        siteId: site.id,
        auditLogDateRange,
      })

      const loginRows = rows.filter(
        (r) => r['"Event type"'] === AuditLogEvent.Login,
      )
      expect(loginRows.map((r) => r.Description)).toEqual([
        "Login attempt by active@agency.gov.sg from IP address 10.0.0.1",
      ])
    })

    // Semantic change (ported from main, PR #2612): the Login/Logout gate is
    // built ONLY from `ResourcePermission` collaboration windows. A user whose
    // grant is visible solely as a PermissionCreate audit event (their
    // ResourcePermission row was hard-deleted) has no window, so their Login
    // is now EXCLUDED — previously the `emailsFromPermissionChanges` CTE
    // allow-listed it.
    it("excludes a Login for a user known only via a permission-change event (no ResourcePermission row)", async () => {
      const { site } = await setupSite()
      const actor = await setupUser({ email: "admin@agency.gov.sg" })

      // This user has NO ResourcePermission row for the site — only a
      // PermissionCreate audit event within the window.
      const changedUser = await setupUser({
        email: "changed@agency.gov.sg",
      })

      await insertAuditLog({
        eventType: AuditLogEvent.PermissionCreate,
        userId: actor.id,
        siteId: site.id,
        delta: {
          before: null,
          after: { userId: changedUser.id, role: RoleType.Editor },
        },
        createdAt: new Date("2024-03-10T02:00:00Z"),
      })

      await insertAuditLog({
        eventType: AuditLogEvent.Login,
        userId: changedUser.id,
        siteId: null,
        delta: {
          before: { identifier: "changed@agency.gov.sg|10.0.0.9" },
          after: null,
        },
        createdAt: new Date("2024-03-11T02:00:00Z"),
      })

      const rows = await getActivityReportRows({
        siteId: site.id,
        auditLogDateRange,
      })

      const loginRows = rows.filter(
        (r) => r['"Event type"'] === AuditLogEvent.Login,
      )
      expect(loginRows).toHaveLength(0)
      // The PermissionCreate event itself still appears in the report.
      const createRows = rows.filter(
        (r) => r['"Event type"'] === AuditLogEvent.PermissionCreate,
      )
      expect(createRows).toHaveLength(1)
    })

    it("excludes a displayable event that belongs to a different site", async () => {
      const { site } = await setupSite()
      const { site: otherSite } = await setupSite()
      const user = await setupUser({ email: "editor@agency.gov.sg" })

      await insertAuditLog({
        eventType: AuditLogEvent.ResourceCreate,
        userId: user.id,
        siteId: otherSite.id,
        delta: {
          before: null,
          after: { resource: { title: "Other Page", type: "Page", id: "7" } },
        },
        createdAt: new Date("2024-03-10T02:00:00Z"),
      })

      const rows = await getActivityReportRows({
        siteId: site.id,
        auditLogDateRange,
      })
      expect(rows).toHaveLength(0)
    })

    it("renders RedirectCreate, RedirectCreate-revival and RedirectDelete descriptions", async () => {
      const { site } = await setupSite()
      const user = await setupUser({ email: "editor@agency.gov.sg" })

      // Newly created redirect (no `before`)
      await insertAuditLog({
        eventType: AuditLogEvent.RedirectCreate,
        userId: user.id,
        siteId: site.id,
        delta: {
          before: null,
          after: { source: "/old", destination: "/new" },
        },
        createdAt: new Date("2024-03-10T02:00:00Z"),
      })

      // Revival of a soft-deleted redirect (`before.destination` present)
      await insertAuditLog({
        eventType: AuditLogEvent.RedirectCreate,
        userId: user.id,
        siteId: site.id,
        delta: {
          before: { source: "/old", destination: "/stale" },
          after: { source: "/old", destination: "/new" },
        },
        createdAt: new Date("2024-03-11T02:00:00Z"),
      })

      // Deletion
      await insertAuditLog({
        eventType: AuditLogEvent.RedirectDelete,
        userId: user.id,
        siteId: site.id,
        delta: {
          before: { source: "/old", destination: "/new" },
          after: { source: "/old", destination: "/new" },
        },
        createdAt: new Date("2024-03-12T02:00:00Z"),
      })

      const rows = await getActivityReportRows({
        siteId: site.id,
        auditLogDateRange,
      })

      expect(rows.map((r) => r.Description)).toEqual([
        'Redirect from "/old" to "/new" created',
        'Redirect from "/old" to "/new" revived (was: "/stale")',
        'Redirect from "/old" to "/new" deleted',
      ])
    })

    // Login/Logout events only appear while the user was an ACTIVE
    // collaborator at the event's own timestamp (PR #2612): granted no later
    // than the event, and not yet revoked at the event.
    describe("active-collaborator window gating of Login/Logout", () => {
      const GRANTED_BEFORE_RANGE = new Date("2024-02-01T00:00:00Z")
      const T_05 = new Date("2024-03-05T02:00:00Z")
      const T_10 = new Date("2024-03-10T02:00:00Z")
      const T_15 = new Date("2024-03-15T02:00:00Z")
      const T_20 = new Date("2024-03-20T02:00:00Z")
      const T_25 = new Date("2024-03-25T02:00:00Z")

      const insertLoginFor = async (
        collaborator: Awaited<ReturnType<typeof setupUser>>,
        at: Date,
      ) =>
        insertAuditLog({
          eventType: AuditLogEvent.Login,
          userId: collaborator.id,
          siteId: null,
          delta: {
            before: { identifier: `${collaborator.email}|1.2.3.4` },
            after: null,
          },
          createdAt: at,
        })

      const insertLogoutFor = async (
        collaborator: Awaited<ReturnType<typeof setupUser>>,
        at: Date,
      ) =>
        insertAuditLog({
          eventType: AuditLogEvent.Logout,
          userId: collaborator.id,
          siteId: null,
          delta: { before: { email: collaborator.email }, after: null },
          createdAt: at,
        })

      it("includes a Login during an active collaboration window", async () => {
        const { site } = await setupSite()
        const collaborator = await setupUser({ email: "active@agency.gov.sg" })
        await setupPermission({
          userId: collaborator.id,
          siteId: site.id,
          createdAt: GRANTED_BEFORE_RANGE,
          deletedAt: T_20,
        })
        await insertLoginFor(collaborator, T_10)

        const rows = await getActivityReportRows({
          siteId: site.id,
          auditLogDateRange,
        })
        expect(rows.map((r) => r['"Event type"'])).toEqual([
          AuditLogEvent.Login,
        ])
      })

      it("excludes a Login before the collaborator was granted", async () => {
        const { site } = await setupSite()
        const collaborator = await setupUser({
          email: "pregrant@agency.gov.sg",
        })
        await setupPermission({
          userId: collaborator.id,
          siteId: site.id,
          createdAt: T_15,
          deletedAt: null,
        })
        await insertLoginFor(collaborator, T_10)

        const rows = await getActivityReportRows({
          siteId: site.id,
          auditLogDateRange,
        })
        expect(rows).toHaveLength(0)
      })

      it("excludes a Login after the collaborator was revoked", async () => {
        const { site } = await setupSite()
        const collaborator = await setupUser({
          email: "postrevoke@agency.gov.sg",
        })
        await setupPermission({
          userId: collaborator.id,
          siteId: site.id,
          createdAt: GRANTED_BEFORE_RANGE,
          deletedAt: T_20,
        })
        await insertLoginFor(collaborator, T_25)

        const rows = await getActivityReportRows({
          siteId: site.id,
          auditLogDateRange,
        })
        expect(rows).toHaveLength(0)
      })

      it("removed then re-added: logins in the active windows show, the gap does not", async () => {
        // Window 1: [GRANTED_BEFORE_RANGE, T_10); window 2: [T_20, ∞)
        const { site } = await setupSite()
        const collaborator = await setupUser({ email: "readded@agency.gov.sg" })
        await setupPermission({
          userId: collaborator.id,
          siteId: site.id,
          createdAt: GRANTED_BEFORE_RANGE,
          deletedAt: T_10,
        })
        await setupPermission({
          userId: collaborator.id,
          siteId: site.id,
          createdAt: T_20,
          deletedAt: null,
        })
        await insertLoginFor(collaborator, T_05) // in window 1
        await insertLoginFor(collaborator, T_15) // in the gap
        await insertLoginFor(collaborator, T_25) // in window 2

        const rows = await getActivityReportRows({
          siteId: site.id,
          auditLogDateRange,
        })
        const times = rows
          .filter((r) => r['"Event type"'] === AuditLogEvent.Login)
          .map((r) => r['"Date and time"'].getTime())
        expect(times).toEqual([T_05.getTime(), T_25.getTime()])
      })

      it("includes a Logout during an active collaboration window and excludes one at the exact moment of revocation", async () => {
        const { site } = await setupSite()
        const collaborator = await setupUser({
          email: "logouts@agency.gov.sg",
        })
        await setupPermission({
          userId: collaborator.id,
          siteId: site.id,
          createdAt: GRANTED_BEFORE_RANGE,
          deletedAt: T_20,
        })
        await insertLogoutFor(collaborator, T_10) // during the window
        await insertLogoutFor(collaborator, T_20) // exactly at revocation

        const rows = await getActivityReportRows({
          siteId: site.id,
          auditLogDateRange,
        })
        const logoutTimes = rows
          .filter((r) => r['"Event type"'] === AuditLogEvent.Logout)
          .map((r) => r['"Date and time"'].getTime())
        expect(logoutTimes).toEqual([T_10.getTime()])
      })

      it("excludes a Logout by an Isomer admin", async () => {
        const { site } = await setupSite()
        const isomerAdmin = await setupUser({ email: "admin@open.gov.sg" })
        await setupIsomerAdmin({ userId: isomerAdmin.id })
        await setupPermission({
          userId: isomerAdmin.id,
          siteId: site.id,
          createdAt: GRANTED_BEFORE_RANGE,
          deletedAt: null,
        })
        await insertLogoutFor(isomerAdmin, T_10)

        const rows = await getActivityReportRows({
          siteId: site.id,
          auditLogDateRange,
        })
        expect(rows).toHaveLength(0)
      })
    })
  })

  describe("getStringifiedValue", () => {
    it("returns empty string for null and undefined", () => {
      expect(getStringifiedValue(null)).toBe("")
      expect(getStringifiedValue(undefined)).toBe("")
    })

    it("renders dates in Singapore time with a +08:00 offset", () => {
      expect(getStringifiedValue(new Date("2025-01-15T10:00:00.000Z"))).toBe(
        "2025-01-15T18:00:00.000+08:00",
      )
    })

    it("returns strings verbatim", () => {
      expect(getStringifiedValue("hello")).toBe("hello")
      expect(getStringifiedValue("")).toBe("")
    })

    it("does not drop falsy non-null scalars", () => {
      expect(getStringifiedValue(0)).toBe("0")
      expect(getStringifiedValue(false)).toBe("false")
    })

    it("JSON-stringifies objects and arrays", () => {
      expect(getStringifiedValue({ a: 1 })).toBe('{"a":1}')
      expect(getStringifiedValue([1, 2])).toBe("[1,2]")
      expect(
        getStringifiedValue({ before: { email: "a@b.com" }, after: null }),
      ).toBe('{"before":{"email":"a@b.com"},"after":null}')
    })
  })

  describe("toCsv", () => {
    it("produces a header row plus one data row per input row", () => {
      const rows = [
        {
          Email: "a@agency.gov.sg",
          Role: "Admin",
          "Date added": new Date("2024-02-15T00:00:00Z"),
          "Last login": null,
        },
        {
          Email: "b@agency.gov.sg",
          Role: "Editor",
          "Date added": new Date("2024-02-16T00:00:00Z"),
          "Last login": new Date("2024-03-01T00:00:00Z"),
        },
      ]

      const csv = toCsv(rows)
      // Papa Parse uses CRLF line endings by default; split on either.
      const lines = csv.split(/\r\n|\n/)

      // 1 header + 2 data rows. Quotes are stripped from the header labels.
      expect(lines).toHaveLength(3)
      expect(lines[0]).toBe("Email,Role,Date added,Last login")
      // Dates render in Singapore time (+08:00), so 00:00Z → 08:00+08:00.
      expect(lines[1]).toBe(
        "a@agency.gov.sg,Admin,2024-02-15T08:00:00.000+08:00,",
      )
      expect(lines[2]).toBe(
        "b@agency.gov.sg,Editor,2024-02-16T08:00:00.000+08:00,2024-03-01T08:00:00.000+08:00",
      )
    })

    it("returns an empty string for no rows", () => {
      expect(toCsv([])).toBe("")
    })
  })
})
