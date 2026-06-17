import { TRPCError } from "@trpc/server"
import { resetTables } from "tests/integration/helpers/db"
import {
  applyAuthedSession,
  applySession,
  createMockRequest,
} from "tests/integration/helpers/iron-session"
import {
  setupEditorPermissions,
  setupPageResource,
} from "tests/integration/helpers/seed"
import { createCallerFactory } from "~/server/trpc"

import { db } from "../../database"
import { previewLinkRouter } from "../previewLink.router"

const createCaller = createCallerFactory(previewLinkRouter)

const TABLES_TO_RESET = [
  "PreviewLink",
  "AuditLog",
  "ResourcePermission",
  "Resource",
  "Blob",
  "Navbar",
  "Footer",
  "Site",
  "VerificationToken",
  "User",
] as const

describe("previewLinkRouter", () => {
  let session: Awaited<ReturnType<typeof applyAuthedSession>>
  let caller: ReturnType<typeof createCaller>

  beforeEach(async () => {
    await resetTables(...TABLES_TO_RESET)
    session = await applyAuthedSession()
    caller = createCaller(createMockRequest(session))
  })

  describe("mint", () => {
    it("should throw 401 if not logged in", async () => {
      // Arrange
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      // Act
      const result = unauthedCaller.mint({
        siteId: 1,
        resourceId: 1,
        expiryChoice: "7d",
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should throw 403 if the user lacks edit permission on the site", async () => {
      // Arrange
      const { site, page } = await setupPageResource({ resourceType: "Page" })

      // Act — session.userId has no permission on this site
      const result = caller.mint({
        siteId: site.id,
        resourceId: Number(page.id),
        expiryChoice: "7d",
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )

      const inserted = await db.selectFrom("PreviewLink").selectAll().execute()
      expect(inserted).toHaveLength(0)
    })

    it("should mint a preview link for an authorised editor", async () => {
      // Arrange
      const { site, page } = await setupPageResource({ resourceType: "Page" })
      await setupEditorPermissions({
        userId: session.userId,
        siteId: site.id,
      })

      // Act
      const result = await caller.mint({
        siteId: site.id,
        resourceId: Number(page.id),
        expiryChoice: "7d",
        label: "For Director Tan",
      })

      // Assert — response shape
      expect(result.token).toMatch(/^[A-Za-z0-9_-]{43}$/)
      expect(result.url.endsWith(`/preview/${result.token}`)).toBe(true)
      expect(result.label).toBe("For Director Tan")
      expect(result.expiresAt).toBeInstanceOf(Date)

      // Assert — DB row
      const row = await db
        .selectFrom("PreviewLink")
        .where("token", "=", result.token)
        .selectAll()
        .executeTakeFirstOrThrow()
      expect(Number(row.resourceId)).toBe(Number(page.id))
      expect(row.siteId).toBe(site.id)
      expect(row.createdBy).toBe(session.userId)
      expect(row.label).toBe("For Director Tan")
      expect(row.revokedAt).toBeNull()
      expect(row.revokedBy).toBeNull()
    })

    it("should compute expiresAt from the chosen duration", async () => {
      // Arrange
      const { site, page } = await setupPageResource({ resourceType: "Page" })
      await setupEditorPermissions({
        userId: session.userId,
        siteId: site.id,
      })

      // Act
      const before = Date.now()
      const result = await caller.mint({
        siteId: site.id,
        resourceId: Number(page.id),
        expiryChoice: "24h",
      })
      const after = Date.now()

      // Assert — within [before+24h, after+24h]
      const expectedMin = before + 24 * 60 * 60 * 1000
      const expectedMax = after + 24 * 60 * 60 * 1000
      expect(result.expiresAt.getTime()).toBeGreaterThanOrEqual(expectedMin)
      expect(result.expiresAt.getTime()).toBeLessThanOrEqual(expectedMax)
    })

    it("should reject a label longer than 80 characters", async () => {
      // Arrange
      const { site, page } = await setupPageResource({ resourceType: "Page" })
      await setupEditorPermissions({
        userId: session.userId,
        siteId: site.id,
      })

      // Act
      const result = caller.mint({
        siteId: site.id,
        resourceId: Number(page.id),
        expiryChoice: "7d",
        label: "x".repeat(81),
      })

      // Assert
      await expect(result).rejects.toThrow()
    })
  })
})
