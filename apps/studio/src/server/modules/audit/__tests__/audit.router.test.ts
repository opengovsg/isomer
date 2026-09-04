import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { TRPCError } from "@trpc/server"
import { auth } from "tests/integration/helpers/auth"
import { resetTables } from "tests/integration/helpers/db"
import {
  applyAuthedSession,
  applySession,
  createMockRequest,
} from "tests/integration/helpers/iron-session"
import {
  setupAdminPermissions,
  setupEditorPermissions,
  setupIsomerAdmin,
  setupSite,
  setupUser,
} from "tests/integration/helpers/seed"
import { getCurrentSingaporeMonth } from "~/schemas/audit"
import { createCallerFactory } from "~/server/trpc"

import type { User } from "../../database"
import { db } from "../../database"
import { auditRouter } from "../audit.router"
import { getMonthDateRange } from "../auditLogExport.query"

const createCaller = createCallerFactory(auditRouter)

// A month inside the allowed export window. The current Singapore-time month
// is always valid: never in the future, and within the 12-month window — so
// the happy-path tests don't rot as real time advances.
const VALID_MONTH = getCurrentSingaporeMonth()

// All AuditLogExportRequest rows for a (site, user), oldest-id first. Tables
// are reset per test, so this is every row the test created. Deliberately not
// filtered by the stored daterange: rejected inputs (e.g. a future month) must
// leave ZERO rows behind.
const getRequestRows = async ({
  siteId,
  userId,
}: {
  siteId: number
  userId: string
}) => {
  return db
    .selectFrom("AuditLogExportRequest")
    .where("siteId", "=", siteId)
    .where("userId", "=", userId)
    .orderBy("id", "asc")
    .selectAll()
    .execute()
}

// Every accepted ask — including an idempotent-accepted duplicate — must be
// recorded as an AuditLogExportCreate event. Rejected asks (FORBIDDEN/
// BAD_REQUEST) must leave no event behind.
const getExportCreateEvents = async ({ siteId }: { siteId: number }) => {
  return db
    .selectFrom("AuditLog")
    .where("siteId", "=", siteId)
    .where("eventType", "=", "AuditLogExportCreate")
    .orderBy("id", "asc")
    .selectAll()
    .execute()
}

describe("audit.router", async () => {
  let caller: ReturnType<typeof createCaller>
  const session = await applyAuthedSession()
  let user: User

  beforeAll(() => {
    caller = createCaller(createMockRequest(session))
  })

  beforeEach(async () => {
    await resetTables(
      "AuditLogExportRequest",
      "AuditLog",
      "IsomerAdmin",
      "ResourcePermission",
      "Site",
      "User",
    )
    user = await setupUser({
      userId: session.userId,
      email: "test@mock.com",
    })
    await auth(user)
    caller = createCaller(createMockRequest(session))
  })

  describe("createExportRequest", () => {

    it("should throw 401 if not logged in", async () => {
      // Arrange
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))
      const { site } = await setupSite()

      // Act
      const result = unauthedCaller.createExportRequest({
        scope: "site",
        siteId: site.id,
        month: VALID_MONTH,
        reportType: "Access",
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    describe("should create a single Pending request for a concrete report type", () => {
      let result: Awaited<ReturnType<typeof caller.createExportRequest>>
      let auditLogDateRange: ReturnType<typeof getMonthDateRange>
      let rows: Awaited<ReturnType<typeof getRequestRows>>
      let events: Awaited<ReturnType<typeof getExportCreateEvents>>
      let site: Awaited<ReturnType<typeof setupSite>>["site"]

      beforeEach(async () => {
        // Arrange
        const setup = await setupSite()
        site = setup.site
        await setupAdminPermissions({
          userId: session.userId,
          siteId: site.id,
        })

        // Act
        result = await caller.createExportRequest({
          scope: "site",
          siteId: site.id,
          month: VALID_MONTH,
          reportType: "Access",
        })

        auditLogDateRange = getMonthDateRange(VALID_MONTH, new Date())
        rows = await getRequestRows({
          siteId: site.id,
          userId: session.userId!,
        })
        events = await getExportCreateEvents({ siteId: site.id })
      })

      it("inserts and returns the pending export request", async () => {
        // Assert: one inserted row, stored as the daterange derived from the
        // picked month, and returned as an array (the fan-out contract).
        expect(result).toHaveLength(1)
        expect(result[0]).toMatchObject({
          siteId: site.id,
          userId: session.userId,
          auditLogDateRange,
          reportType: "Access",
          status: "Pending",
          attempts: 0,
        })
        expect(result[0]?.id).toBeDefined()
        expect(rows).toHaveLength(1)
      })

      it("audit-logs the export request", async () => {
        // Assert: The ask itself is audit-logged: one AuditLogExportCreate event whose
        // delta records what was asked for (the requested type, verbatim).
        expect(events).toHaveLength(1)
        expect(events[0]).toMatchObject({
          userId: session.userId,
          siteId: site.id,
          delta: {
            before: null,
            after: { auditLogDateRange, reportType: "Access" },
          },
        })
      })
    })

    it("should allow an Isomer Admin without a site permission to request an export", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupIsomerAdmin({ userId: session.userId! })

      // Act
      const result = await caller.createExportRequest({
        scope: "site",
        siteId: site.id,
        month: VALID_MONTH,
        reportType: "Access",
      })

      // Assert
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        siteId: site.id,
        userId: session.userId,
        reportType: "Access",
        status: "Pending",
      })
    })

    it("records the requester IP on the AuditLogExportCreate event", async () => {
      // Arrange: a caller whose request carries a forwarded client IP, the same
      // way our edge/proxy sets it in production (see getClientIp).
      const { site } = await setupSite()
      await setupAdminPermissions({
        userId: session.userId,
        siteId: site.id,
      })
      const ipCaller = createCaller(
        createMockRequest(session, {
          method: "GET",
          headers: { "x-forwarded-for": "203.0.113.7" },
        }),
      )

      // Act
      await ipCaller.createExportRequest({
        scope: "site",
        siteId: site.id,
        month: VALID_MONTH,
        reportType: "Access",
      })

      // Assert: the event captures the requester IP, not null — matching the
      // provenance that sibling resource/permission/login events record.
      const events = await getExportCreateEvents({ siteId: site.id })
      expect(events).toHaveLength(1)
      expect(events[0]).toMatchObject({
        userId: session.userId,
        siteId: site.id,
        ipAddress: "203.0.113.7",
      })
    })

    it("should throw FORBIDDEN when the caller is only an Editor", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupEditorPermissions({
        userId: session.userId,
        siteId: site.id,
      })

      // Act
      const result = caller.createExportRequest({
        scope: "site",
        siteId: site.id,
        month: VALID_MONTH,
        reportType: "Access",
      })

      // Assert
      await expect(result).rejects.toMatchObject({ code: "FORBIDDEN" })
      const rows = await getRequestRows({
        siteId: site.id,
        userId: session.userId!,
      })
      expect(rows).toHaveLength(0)
    })

    it("should throw FORBIDDEN when the caller has no permission on the site", async () => {
      // Arrange
      const { site } = await setupSite()

      // Act
      const result = caller.createExportRequest({
        scope: "site",
        siteId: site.id,
        month: VALID_MONTH,
        reportType: "Activity",
      })

      // Assert
      await expect(result).rejects.toMatchObject({ code: "FORBIDDEN" })
      const rows = await getRequestRows({
        siteId: site.id,
        userId: session.userId!,
      })
      expect(rows).toHaveLength(0)
    })

    it("should accept a duplicate ask idempotently, returning the in-flight row and recording a second event", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupAdminPermissions({
        userId: session.userId,
        siteId: site.id,
      })

      // Act — first request queues a row
      const first = await caller.createExportRequest({
        scope: "site",
        siteId: site.id,
        month: VALID_MONTH,
        reportType: "Access",
      })

      // Act — second identical request succeeds instead of erroring
      const second = await caller.createExportRequest({
        scope: "site",
        siteId: site.id,
        month: VALID_MONTH,
        reportType: "Access",
      })

      // Assert: the duplicate resolves to the SAME in-flight row (no second
      // row is queued)...
      expect(second).toHaveLength(1)
      expect(second[0]?.id).toBe(first[0]?.id)
      const rows = await getRequestRows({
        siteId: site.id,
        userId: session.userId!,
      })
      expect(rows).toHaveLength(1)

      // ...but the duplicate ASK is still recorded: one event per ask.
      const events = await getExportCreateEvents({ siteId: site.id })
      expect(events).toHaveLength(2)
    })

    it("should throw BAD_REQUEST when the month is in the future", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupAdminPermissions({
        userId: session.userId,
        siteId: site.id,
      })

      // Act
      const result = caller.createExportRequest({
        scope: "site",
        siteId: site.id,
        month: "2999-12",
        reportType: "Activity",
      })

      // Assert
      await expect(result).rejects.toMatchObject({ code: "BAD_REQUEST" })
      const rows = await getRequestRows({
        siteId: site.id,
        userId: session.userId!,
      })
      expect(rows).toHaveLength(0)
    })

    it("should throw BAD_REQUEST when the month is older than the 12-month window", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupAdminPermissions({
        userId: session.userId,
        siteId: site.id,
      })
      const tooOldMonth = "2000-01"

      // Act
      const result = caller.createExportRequest({
        scope: "site",
        siteId: site.id,
        month: tooOldMonth,
        reportType: "Activity",
      })

      // Assert
      await expect(result).rejects.toMatchObject({ code: "BAD_REQUEST" })
      const rows = await getRequestRows({
        siteId: site.id,
        userId: session.userId!,
      })
      expect(rows).toHaveLength(0)
    })

    describe("allSites scope", () => {

      it("fans out across every site the caller Admins, skipping sites without permission", async () => {
        // Arrange: caller is Admin on two sites, has no permission on a third.
        const { site: adminSiteA } = await setupSite()
        const { site: adminSiteB } = await setupSite()
        const { site: otherSite } = await setupSite()
        await setupAdminPermissions({
          userId: session.userId,
          siteId: adminSiteA.id,
        })
        await setupAdminPermissions({
          userId: session.userId,
          siteId: adminSiteB.id,
        })

        // Act
        const result = await caller.createExportRequest({
          scope: "allSites",
          month: VALID_MONTH,
          reportType: "Activity",
        })

        // Assert: one row per admin site, none for the site without permission.
        expect(result).toHaveLength(2)
        expect(result.map((row) => row.siteId).sort((a, b) => a - b)).toStrictEqual(
          [adminSiteA.id, adminSiteB.id].sort((a, b) => a - b),
        )

        const otherSiteRows = await getRequestRows({
          siteId: otherSite.id,
          userId: session.userId!,
        })
        expect(otherSiteRows).toHaveLength(0)

        // One AuditLogExportCreate event per site, not one ambiguous event
        // for the whole ask.
        const eventsA = await getExportCreateEvents({ siteId: adminSiteA.id })
        const eventsB = await getExportCreateEvents({ siteId: adminSiteB.id })
        expect(eventsA).toHaveLength(1)
        expect(eventsB).toHaveLength(1)
      })

      it("fans out across every site in the DB for an Isomer Admin", async () => {
        // Arrange: two sites exist; the caller has no explicit permission on
        // either, only their (implicit, Isomer-wide) Admin status.
        const { site: siteA } = await setupSite()
        const { site: siteB } = await setupSite()
        await setupIsomerAdmin({ userId: session.userId! })

        // Act
        const result = await caller.createExportRequest({
          scope: "allSites",
          month: VALID_MONTH,
          reportType: "Activity",
        })

        // Assert
        expect(result).toHaveLength(2)
        expect(result.map((row) => row.siteId).sort((a, b) => a - b)).toStrictEqual(
          [siteA.id, siteB.id].sort((a, b) => a - b),
        )
      })

      it("throws FORBIDDEN when the caller is not an Admin on any site", async () => {
        // Arrange: a site exists, but the caller has no permission on it and
        // is not an Isomer Admin.
        await setupSite()

        // Act
        const result = caller.createExportRequest({
          scope: "allSites",
          month: VALID_MONTH,
          reportType: "Activity",
        })

        // Assert
        await expect(result).rejects.toMatchObject({ code: "FORBIDDEN" })
      })
    })
  })
})
