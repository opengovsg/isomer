import { TRPCError } from "@trpc/server"
import { resetTables } from "tests/integration/helpers/db"
import {
  applyAuthedSession,
  applySession,
  createMockRequest,
} from "tests/integration/helpers/iron-session"
import {
  setupAdminPermissions,
  setupEditorPermissions,
  setupPageResource,
  setupUser,
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

      // Assert — audit row written inside the mint transaction
      const auditRows = await db
        .selectFrom("AuditLog")
        .where("eventType", "=", "PreviewLinkMint")
        .selectAll()
        .execute()
      expect(auditRows).toHaveLength(1)
      expect(auditRows[0]?.userId).toBe(session.userId)
      expect(auditRows[0]?.siteId).toBe(site.id)
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

  describe("revoke", () => {
    const mintForCurrent = async (site: { id: number }, pageId: string) => {
      await setupEditorPermissions({
        userId: session.userId,
        siteId: site.id,
      })
      return await caller.mint({
        siteId: site.id,
        resourceId: Number(pageId),
        expiryChoice: "7d",
      })
    }

    it("lets the sharer revoke their own link", async () => {
      const { site, page } = await setupPageResource({ resourceType: "Page" })
      const minted = await mintForCurrent(site, page.id)

      const linkId = await db
        .selectFrom("PreviewLink")
        .where("token", "=", minted.token)
        .select("id")
        .executeTakeFirstOrThrow()

      await caller.revoke({ linkId: String(linkId.id) })

      const row = await db
        .selectFrom("PreviewLink")
        .where("token", "=", minted.token)
        .selectAll()
        .executeTakeFirstOrThrow()
      expect(row.revokedAt).not.toBeNull()
      expect(row.revokedBy).toBe(session.userId)

      const auditRows = await db
        .selectFrom("AuditLog")
        .where("eventType", "=", "PreviewLinkRevoke")
        .selectAll()
        .execute()
      expect(auditRows).toHaveLength(1)
    })

    it("is idempotent on an already-revoked link", async () => {
      const { site, page } = await setupPageResource({ resourceType: "Page" })
      const minted = await mintForCurrent(site, page.id)
      const linkId = (
        await db
          .selectFrom("PreviewLink")
          .where("token", "=", minted.token)
          .select("id")
          .executeTakeFirstOrThrow()
      ).id

      await caller.revoke({ linkId: String(linkId) })
      await caller.revoke({ linkId: String(linkId) })

      const auditRows = await db
        .selectFrom("AuditLog")
        .where("eventType", "=", "PreviewLinkRevoke")
        .selectAll()
        .execute()
      // Idempotent — second revoke writes no second audit row.
      expect(auditRows).toHaveLength(1)
    })

    it("returns NOT_FOUND for a non-existent link", async () => {
      const result = caller.revoke({ linkId: "9999999" })
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "NOT_FOUND",
          message: "Preview link not found",
        }),
      )
    })

    it("lets a Site Admin revoke another sharer's link", async () => {
      // Arrange — a separate sharer with a minted link on the site
      const { site, page } = await setupPageResource({ resourceType: "Page" })
      const sharer = await setupUser({ email: "sharer@example.com" })
      await setupEditorPermissions({ userId: sharer.id, siteId: site.id })
      const link = await db
        .insertInto("PreviewLink")
        .values({
          token: "admin-revoke-test-token",
          siteId: site.id,
          resourceId: String(page.id),
          createdBy: sharer.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        })
        .returningAll()
        .executeTakeFirstOrThrow()

      // Current session user is a Site Admin on the same site
      await setupAdminPermissions({
        userId: session.userId,
        siteId: site.id,
      })

      // Act
      await caller.revoke({ linkId: String(link.id) })

      // Assert — link is revoked, revokedBy is the admin (not the sharer)
      const row = await db
        .selectFrom("PreviewLink")
        .where("id", "=", String(link.id))
        .selectAll()
        .executeTakeFirstOrThrow()
      expect(row.revokedAt).not.toBeNull()
      expect(row.revokedBy).toBe(session.userId)

      const auditRows = await db
        .selectFrom("AuditLog")
        .where("eventType", "=", "PreviewLinkRevoke")
        .selectAll()
        .execute()
      expect(auditRows).toHaveLength(1)
      expect(auditRows[0]?.userId).toBe(session.userId)
    })

    it("throws 403 if the caller is neither the sharer nor a Site Admin", async () => {
      // Arrange — sharer's link exists; current session has no role on site
      const { site, page } = await setupPageResource({ resourceType: "Page" })
      const sharer = await setupUser({ email: "sharer-403@example.com" })
      await setupEditorPermissions({ userId: sharer.id, siteId: site.id })
      const link = await db
        .insertInto("PreviewLink")
        .values({
          token: "non-sharer-revoke-test-token",
          siteId: site.id,
          resourceId: String(page.id),
          createdBy: sharer.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        })
        .returningAll()
        .executeTakeFirstOrThrow()

      // Act
      const result = caller.revoke({ linkId: String(link.id) })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )

      const row = await db
        .selectFrom("PreviewLink")
        .where("id", "=", String(link.id))
        .selectAll()
        .executeTakeFirstOrThrow()
      expect(row.revokedAt).toBeNull()
    })
  })

  describe("listForPage", () => {
    it("returns the current sharer's active links for the page", async () => {
      const { site, page } = await setupPageResource({ resourceType: "Page" })
      await setupEditorPermissions({
        userId: session.userId,
        siteId: site.id,
      })

      const mintedA = await caller.mint({
        siteId: site.id,
        resourceId: Number(page.id),
        expiryChoice: "7d",
        label: "For Director Tan",
      })
      const mintedB = await caller.mint({
        siteId: site.id,
        resourceId: Number(page.id),
        expiryChoice: "24h",
      })

      const list = await caller.listForPage({
        siteId: site.id,
        resourceId: Number(page.id),
      })

      expect(list).toHaveLength(2)
      const urls = list.map((row) => row.url)
      expect(urls).toContain(mintedA.url)
      expect(urls).toContain(mintedB.url)
    })

    it("throws 403 if the user has no permission on the site", async () => {
      const { site, page } = await setupPageResource({ resourceType: "Page" })

      const result = caller.listForPage({
        siteId: site.id,
        resourceId: Number(page.id),
      })

      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )
    })
  })

  describe("listForSite", () => {
    // Helper: insert a PreviewLink row directly (skips mint API + permission
    // check) so we can set up "other sharer's link" scenarios.
    const insertLink = async ({
      siteId,
      resourceId,
      createdBy,
      token,
      revokedAt = null,
      expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    }: {
      siteId: number
      resourceId: string
      createdBy: string
      token: string
      revokedAt?: Date | null
      expiresAt?: Date
    }) =>
      db
        .insertInto("PreviewLink")
        .values({
          token,
          siteId,
          resourceId,
          createdBy,
          expiresAt,
          revokedAt,
          revokedBy: revokedAt ? createdBy : null,
        })
        .returningAll()
        .executeTakeFirstOrThrow()

    it("editor sees only links they minted", async () => {
      const { site, page } = await setupPageResource({ resourceType: "Page" })
      await setupEditorPermissions({
        userId: session.userId,
        siteId: site.id,
      })

      const otherSharer = await setupUser({ email: "other@example.com" })
      await setupEditorPermissions({
        userId: otherSharer.id,
        siteId: site.id,
      })

      await insertLink({
        siteId: site.id,
        resourceId: String(page.id),
        createdBy: session.userId!,
        token: "editor-own-link",
      })
      await insertLink({
        siteId: site.id,
        resourceId: String(page.id),
        createdBy: otherSharer.id,
        token: "other-sharers-link",
      })

      const result = await caller.listForSite({
        siteId: site.id,
        status: "active",
      })

      expect(result.viewerIsAdmin).toBe(false)
      expect(result.links).toHaveLength(1)
      expect(result.links[0]?.url.endsWith("/preview/editor-own-link")).toBe(
        true,
      )
    })

    it("Site Admin sees all links on the site regardless of sharer", async () => {
      const { site, page } = await setupPageResource({ resourceType: "Page" })
      await setupAdminPermissions({
        userId: session.userId,
        siteId: site.id,
      })

      const otherSharerA = await setupUser({ email: "a@example.com" })
      const otherSharerB = await setupUser({ email: "b@example.com" })
      await setupEditorPermissions({
        userId: otherSharerA.id,
        siteId: site.id,
      })
      await setupEditorPermissions({
        userId: otherSharerB.id,
        siteId: site.id,
      })

      await insertLink({
        siteId: site.id,
        resourceId: String(page.id),
        createdBy: otherSharerA.id,
        token: "sharer-a-link",
      })
      await insertLink({
        siteId: site.id,
        resourceId: String(page.id),
        createdBy: otherSharerB.id,
        token: "sharer-b-link",
      })

      const result = await caller.listForSite({
        siteId: site.id,
        status: "active",
      })

      expect(result.viewerIsAdmin).toBe(true)
      expect(result.links).toHaveLength(2)
    })

    it("status filter Revoked returns only revoked links", async () => {
      const { site, page } = await setupPageResource({ resourceType: "Page" })
      await setupAdminPermissions({
        userId: session.userId,
        siteId: site.id,
      })

      await insertLink({
        siteId: site.id,
        resourceId: String(page.id),
        createdBy: session.userId!,
        token: "active-link",
      })
      await insertLink({
        siteId: site.id,
        resourceId: String(page.id),
        createdBy: session.userId!,
        token: "revoked-link",
        revokedAt: new Date(),
      })

      const result = await caller.listForSite({
        siteId: site.id,
        status: "revoked",
      })

      expect(result.links).toHaveLength(1)
      expect(result.links[0]?.url.endsWith("/preview/revoked-link")).toBe(true)
    })
  })
})
