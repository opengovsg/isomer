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

    it("should throw CONFLICT and not create a duplicate for an in-flight request", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupAdminPermissions({
        userId: session.userId,
        siteId: site.id,
      })

      // Act — first request succeeds
      await caller.createExportRequest({
        siteId: site.id,
        month: VALID_MONTH,
        reportType: "Access",
      })

      // Act — second identical request is rejected
      const result = caller.createExportRequest({
        siteId: site.id,
        month: VALID_MONTH,
        reportType: "Access",
      })

      // Assert
      await expect(result).rejects.toMatchObject({ code: "CONFLICT" })
      const rows = await getRequestRows({
        siteId: site.id,
        userId: session.userId!,
      })
      expect(rows).toHaveLength(1)
    })

    it("should throw CONFLICT for a Both request when one of its report types is already in flight, committing nothing", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupAdminPermissions({
        userId: session.userId,
        siteId: site.id,
      })

      // Act — an Access request is already in flight
      await caller.createExportRequest({
        siteId: site.id,
        month: VALID_MONTH,
        reportType: "Access",
      })

      // Act — a Both request for the same range overlaps it on Access
      const result = caller.createExportRequest({
        siteId: site.id,
        month: VALID_MONTH,
        reportType: "Both",
      })

      // Assert: all-or-nothing — the Activity half is NOT committed either.
      await expect(result).rejects.toMatchObject({ code: "CONFLICT" })
      const rows = await getRequestRows({
        siteId: site.id,
        userId: session.userId!,
      })
      expect(rows).toHaveLength(1)
      expect(rows[0]?.reportType).toBe("Access")
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
