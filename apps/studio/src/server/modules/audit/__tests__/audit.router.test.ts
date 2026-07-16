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
// are reset per test, so this is every row the test created — including the
// fan-out rows a `Both` request produces. Deliberately not filtered by the
// stored daterange: rejected inputs (e.g. a future month) must leave ZERO rows
// of any shape behind.
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
// recorded as an AuditLogExportCreate event (one per ask, not per fanned-out
// row). Rejected asks (FORBIDDEN/BAD_REQUEST) must leave no event behind.
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
        siteId: site.id,
        month: VALID_MONTH,
        reportType: "Access",
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should create a single Pending request for a concrete report type", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupAdminPermissions({
        userId: session.userId,
        siteId: site.id,
      })

      // Act
      const result = await caller.createExportRequest({
        siteId: site.id,
        month: VALID_MONTH,
        reportType: "Access",
      })

      // Assert: one inserted row, stored as the daterange derived from the
      // picked month, and returned as an array (the fan-out contract).
      const auditLogDateRange = getMonthDateRange(VALID_MONTH, new Date())
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

      const rows = await getRequestRows({
        siteId: site.id,
        userId: session.userId!,
      })
      expect(rows).toHaveLength(1)

      // The ask itself is audit-logged: one AuditLogExportCreate event whose
      // delta records what was asked for (the requested type, verbatim).
      const events = await getExportCreateEvents({ siteId: site.id })
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

    it("should fan a Both request out into two Pending rows (Access + Activity)", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupAdminPermissions({
        userId: session.userId,
        siteId: site.id,
      })

      // Act
      const result = await caller.createExportRequest({
        siteId: site.id,
        month: VALID_MONTH,
        reportType: "Both",
      })

      // Assert: `Both` is UX vocabulary only — it becomes two independent
      // rows, one per concrete DB report type, sharing the same range.
      const auditLogDateRange = getMonthDateRange(VALID_MONTH, new Date())
      expect(result).toHaveLength(2)
      expect(result.map((row) => row.reportType).sort()).toEqual([
        "Access",
        "Activity",
      ])
      for (const row of result) {
        expect(row).toMatchObject({
          siteId: site.id,
          userId: session.userId,
          auditLogDateRange,
          status: "Pending",
          attempts: 0,
        })
      }

      const rows = await getRequestRows({
        siteId: site.id,
        userId: session.userId!,
      })
      expect(rows).toHaveLength(2)

      // ONE event per ask — not one per fanned-out half — and the delta keeps
      // the user's vocabulary ("Both"), not the storage fan-out.
      const events = await getExportCreateEvents({ siteId: site.id })
      expect(events).toHaveLength(1)
      expect(events[0]).toMatchObject({
        delta: { before: null, after: { reportType: "Both" } },
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
        siteId: site.id,
        month: VALID_MONTH,
        reportType: "Access",
      })

      // Act — second identical request succeeds instead of erroring
      const second = await caller.createExportRequest({
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

    it("should accept a Both request when one of its report types is already in flight, inserting only the missing half", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupAdminPermissions({
        userId: session.userId,
        siteId: site.id,
      })

      // Act — an Access request is already in flight
      const first = await caller.createExportRequest({
        siteId: site.id,
        month: VALID_MONTH,
        reportType: "Access",
      })

      // Act — a Both request for the same range overlaps it on Access
      const result = await caller.createExportRequest({
        siteId: site.id,
        month: VALID_MONTH,
        reportType: "Both",
      })

      // Assert: the Access half resolves to the existing in-flight row and
      // only the Activity half inserts a new one — two rows total, never
      // three, and no error anywhere.
      expect(result).toHaveLength(2)
      expect(result.map((row) => row.reportType).sort()).toEqual([
        "Access",
        "Activity",
      ])
      expect(result.find((row) => row.reportType === "Access")?.id).toBe(
        first[0]?.id,
      )
      const rows = await getRequestRows({
        siteId: site.id,
        userId: session.userId!,
      })
      expect(rows).toHaveLength(2)
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
        siteId: site.id,
        month: "2999-12",
        reportType: "Both",
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
        siteId: site.id,
        month: tooOldMonth,
        reportType: "Both",
      })

      // Assert
      await expect(result).rejects.toMatchObject({ code: "BAD_REQUEST" })
      const rows = await getRequestRows({
        siteId: site.id,
        userId: session.userId!,
      })
      expect(rows).toHaveLength(0)
    })
  })
})
