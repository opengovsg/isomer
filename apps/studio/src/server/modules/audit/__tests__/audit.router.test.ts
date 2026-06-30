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

const createCaller = createCallerFactory(auditRouter)

// A month inside the allowed export window. The current Singapore-time month
// is always valid: never in the future, and within the 12-month window — so
// the happy-path tests don't rot as real time advances.
const VALID_MONTH = getCurrentSingaporeMonth()

const countRequests = async ({
  siteId,
  userId,
  month,
  reportType,
}: {
  siteId: number
  userId: string
  month: string
  reportType: "Access" | "Activity" | "Both"
}) => {
  const { count } = await db
    .selectFrom("AuditLogExportRequest")
    .where("siteId", "=", siteId)
    .where("userId", "=", userId)
    .where("month", "=", month)
    .where("reportType", "=", reportType)
    .select((eb) => eb.fn.countAll().as("count"))
    .executeTakeFirstOrThrow()
  return Number(count)
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

    it("should create a Pending request when the caller is a Site Admin", async () => {
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

      // Assert
      expect(result).toMatchObject({
        siteId: site.id,
        userId: session.userId,
        month: VALID_MONTH,
        reportType: "Both",
        status: "Pending",
        attempts: 0,
      })
      expect(result.id).toBeDefined()

      const count = await countRequests({
        siteId: site.id,
        userId: session.userId!,
        month: VALID_MONTH,
        reportType: "Both",
      })
      expect(count).toBe(1)
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
      const count = await countRequests({
        siteId: site.id,
        userId: session.userId!,
        month: VALID_MONTH,
        reportType: "Access",
      })
      expect(count).toBe(0)
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
      const count = await countRequests({
        siteId: site.id,
        userId: session.userId!,
        month: VALID_MONTH,
        reportType: "Activity",
      })
      expect(count).toBe(0)
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
      const count = await countRequests({
        siteId: site.id,
        userId: session.userId!,
        month: VALID_MONTH,
        reportType: "Access",
      })
      expect(count).toBe(1)
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
      const count = await countRequests({
        siteId: site.id,
        userId: session.userId!,
        month: "2999-12",
        reportType: "Both",
      })
      expect(count).toBe(0)
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
      const count = await countRequests({
        siteId: site.id,
        userId: session.userId!,
        month: tooOldMonth,
        reportType: "Both",
      })
      expect(count).toBe(0)
    })
  })
})
