import { resetTables } from "tests/integration/helpers/db"
import { setupSite, setupUser } from "tests/integration/helpers/seed"
import { beforeEach, describe, expect, it } from "vitest"

import { AuditLogEvent, db, jsonb, RoleType } from "../../database"
import {
  getAccessReportRows,
  getActivityReportRows,
  getSingaporeMonthBoundaries,
  toCsv,
} from "../auditLogExport.query"

// A non-future, deterministic month literal used throughout.
const MONTH = "2024-03"

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
      metadata: jsonb(metadata) as never,
      ipAddress,
      createdAt,
      updatedAt: createdAt,
    })
    .returningAll()
    .executeTakeFirstOrThrow()
}

describe("auditLogExport.query", () => {
  beforeEach(async () => {
    await resetTables("AuditLog", "ResourcePermission", "User", "Site")
  })

  describe("getSingaporeMonthBoundaries", () => {
    it("computes month boundaries in Singapore time (UTC+8)", () => {
      const { monthStart, monthEnd } = getSingaporeMonthBoundaries("2024-03")

      // 2024-03-01 00:00 SGT === 2024-02-29 16:00 UTC
      expect(monthStart.toISOString()).toBe("2024-02-29T16:00:00.000Z")
      // last ms of 2024-03 SGT === 2024-04-01 00:00 SGT - 1ms === 2024-03-31 15:59:59.999 UTC
      expect(monthEnd.toISOString()).toBe("2024-03-31T15:59:59.999Z")
    })

    it("rolls over the year for December", () => {
      const { monthStart, monthEnd } = getSingaporeMonthBoundaries("2024-12")
      expect(monthStart.toISOString()).toBe("2024-11-30T16:00:00.000Z")
      expect(monthEnd.toISOString()).toBe("2024-12-31T15:59:59.999Z")
    })

    it("rejects a malformed month", () => {
      expect(() => getSingaporeMonthBoundaries("2024-13")).toThrow()
      expect(() => getSingaporeMonthBoundaries("not-a-month")).toThrow()
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

      const rows = await getAccessReportRows({ siteId: site.id, month: MONTH })
      const emails = rows.map((r) => r.Email).sort()

      expect(emails).toEqual([
        "active@agency.gov.sg",
        "revoked-late@agency.gov.sg",
      ])
    })

    it("excludes @open.gov.sg users even if they hold a permission", async () => {
      const { site } = await setupSite()

      const isomerUser = await setupUser({ email: "teammate@open.gov.sg" })
      await setupPermission({
        userId: isomerUser.id,
        siteId: site.id,
        createdAt: new Date("2024-02-01T00:00:00Z"),
      })

      const agencyUser = await setupUser({ email: "agency@agency.gov.sg" })
      await setupPermission({
        userId: agencyUser.id,
        siteId: site.id,
        createdAt: new Date("2024-02-01T00:00:00Z"),
      })

      const rows = await getAccessReportRows({ siteId: site.id, month: MONTH })
      expect(rows.map((r) => r.Email)).toEqual(["agency@agency.gov.sg"])
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

      const rows = await getAccessReportRows({ siteId: site.id, month: MONTH })
      expect(rows.map((r) => r.Email)).toEqual(["in-month@agency.gov.sg"])
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

      const rows = await getAccessReportRows({ siteId: site.id, month: MONTH })
      expect(rows).toHaveLength(1)
      // String-alias columns keep their quotes in the key (matches the
      // script; `toCsv` strips them for the CSV header).
      expect(rows[0]).toEqual({
        Email: "shape@agency.gov.sg",
        Role: RoleType.Admin,
        '"Date added"': createdAt,
        '"Last login"': lastLoginAt,
      })
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
        month: MONTH,
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
        month: MONTH,
      })
      expect(rows).toHaveLength(1)
      expect(rows[0]?.Description).toBe('"March Page" (Page 98) created')
    })

    it("excludes Login events by @open.gov.sg users", async () => {
      const { site } = await setupSite()

      // Agency user with a permission → their Login is INCLUDED
      const agencyUser = await setupUser({ email: "agency@agency.gov.sg" })
      await setupPermission({
        userId: agencyUser.id,
        siteId: site.id,
        createdAt: new Date("2024-02-01T00:00:00Z"),
      })

      // Isomer teammate → excluded from emailsFromUsers, Login NOT shown
      const isomerUser = await setupUser({ email: "teammate@open.gov.sg" })
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
        month: MONTH,
      })

      const loginRows = rows.filter(
        (r) => r['"Event type"'] === AuditLogEvent.Login,
      )
      expect(loginRows).toHaveLength(1)
      expect(loginRows[0]?.Description).toBe(
        "Login attempt by agency@agency.gov.sg from IP address 10.0.0.1",
      )
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
