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
  setupSite,
  setupUser,
} from "tests/integration/helpers/seed"
import { createCallerFactory } from "~/server/trpc"

import { db } from "../../database"
import { redirectRouter } from "../redirect.router"

const createCaller = createCallerFactory(redirectRouter)

describe("redirect.router", async () => {
  let caller: ReturnType<typeof createCaller>
  let unauthedCaller: ReturnType<typeof createCaller>
  let siteId: number
  const session = await applyAuthedSession()

  beforeEach(async () => {
    await resetTables(
      "AuditLog",
      "Redirect",
      "ResourcePermission",
      "Whitelist",
      "Site",
      "User",
    )
    const user = await setupUser({
      userId: session.userId,
      email: "test@mock.com",
    })
    await auth(user)
    const { site } = await setupSite()
    siteId = site.id
    await setupAdminPermissions({ userId: user.id, siteId })
    caller = createCaller(createMockRequest(session))
    unauthedCaller = createCaller(createMockRequest(applySession()))
  })

  describe("list", () => {
    it("should throw 401 if not logged in", async () => {
      // Arrange / Act
      const result = unauthedCaller.list({ siteId })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should throw 403 if user does not have read access to the site", async () => {
      // Arrange
      const { site: otherSite } = await setupSite()

      // Act
      const result = caller.list({ siteId: otherSite.id })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )
    })

    it("should return empty list when no redirects exist", async () => {
      // Arrange / Act
      const result = await caller.list({ siteId })

      // Assert
      expect(result).toEqual([])
    })

    it("should return live redirects with correct shape", async () => {
      // Arrange
      await db
        .insertInto("Redirect")
        .values({ siteId, source: "/old", destination: "/new" })
        .execute()

      // Act
      const result = await caller.list({ siteId })

      // Assert
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        source: "/old",
        destination: "/new",
      })
      expect(result[0]!.publishedAt).toBeInstanceOf(Date)
      expect(typeof result[0]!.id).toBe("string")
    })

    it("should not return soft-deleted redirects", async () => {
      // Arrange
      await db
        .insertInto("Redirect")
        .values({
          siteId,
          source: "/removed",
          destination: "/gone",
          deletedAt: new Date(),
        })
        .execute()

      // Act
      const result = await caller.list({ siteId })

      // Assert
      expect(result).toHaveLength(0)
    })

    it("should not return redirects from other sites", async () => {
      // Arrange
      const { site: otherSite } = await setupSite()
      await db
        .insertInto("Redirect")
        .values({
          siteId: otherSite.id,
          source: "/other",
          destination: "/elsewhere",
        })
        .execute()

      // Act
      const result = await caller.list({ siteId })

      // Assert
      expect(result).toHaveLength(0)
    })
  })

  describe("create", () => {
    it("should throw 401 if not logged in", async () => {
      // Arrange / Act
      const result = unauthedCaller.create({
        siteId,
        source: "/old",
        destination: "/new",
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should throw 403 if user does not have update access to the site", async () => {
      // Arrange
      const { site: otherSite } = await setupSite()

      // Act
      const result = caller.create({
        siteId: otherSite.id,
        source: "/old",
        destination: "/new",
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )
    })

    it("should create a redirect that is immediately live", async () => {
      // Arrange / Act
      await caller.create({ siteId, source: "/old", destination: "/new" })

      // Assert
      const result = await caller.list({ siteId })
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        source: "/old",
        destination: "/new",
      })
    })

    it("should normalise the source before persisting", async () => {
      // Arrange / Act
      await caller.create({
        siteId,
        source: "old//path/",
        destination: "/new",
      })

      // Assert
      const result = await caller.list({ siteId })
      expect(result[0]!.source).toBe("/old/path")
    })

    it("should throw 409 if a live redirect already exists for the source", async () => {
      // Arrange
      await db
        .insertInto("Redirect")
        .values({ siteId, source: "/page", destination: "/old-dest" })
        .execute()

      // Act
      const result = caller.create({
        siteId,
        source: "/page",
        destination: "/new-dest",
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({
          code: "CONFLICT",
          message: "A redirect already exists for /page",
        }),
      )
      const row = await db
        .selectFrom("Redirect")
        .select("destination")
        .where("siteId", "=", siteId)
        .where("source", "=", "/page")
        .executeTakeFirstOrThrow()
      expect(row.destination).toBe("/old-dest")
    })

    it("should revive a soft-deleted redirect for the same source", async () => {
      // Arrange
      await db
        .insertInto("Redirect")
        .values({
          siteId,
          source: "/revived",
          destination: "/old",
          deletedAt: new Date(),
        })
        .execute()

      // Act
      await caller.create({
        siteId,
        source: "/revived",
        destination: "/new",
      })

      // Assert
      const result = await caller.list({ siteId })
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        source: "/revived",
        destination: "/new",
      })
    })

    it("should write an audit log entry with the created row", async () => {
      // Arrange / Act
      await caller.create({ siteId, source: "/hello", destination: "/world" })

      // Assert
      const auditEntry = await db
        .selectFrom("AuditLog")
        .selectAll()
        .where("siteId", "=", siteId)
        .where("eventType", "=", "Publish")
        .executeTakeFirstOrThrow()
      expect(auditEntry.userId).toBe(session.userId)
      expect(auditEntry.metadata).toMatchObject({
        redirects: {
          created: [{ source: "/hello", destination: "/world" }],
        },
      })
    })
  })

  describe("delete", () => {
    it("should throw 401 if not logged in", async () => {
      // Arrange / Act
      const result = unauthedCaller.delete({ siteId, id: "1" })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should throw 403 if user does not have update access to the site", async () => {
      // Arrange
      const { site: otherSite } = await setupSite()

      // Act
      const result = caller.delete({ siteId: otherSite.id, id: "1" })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )
    })

    it("should soft-delete the redirect", async () => {
      // Arrange
      const inserted = await db
        .insertInto("Redirect")
        .values({ siteId, source: "/remove-me", destination: "/dest" })
        .returning("id")
        .executeTakeFirstOrThrow()

      // Act
      await caller.delete({ siteId, id: inserted.id })

      // Assert
      const result = await caller.list({ siteId })
      expect(result).toHaveLength(0)
      const row = await db
        .selectFrom("Redirect")
        .select("deletedAt")
        .where("id", "=", inserted.id)
        .executeTakeFirstOrThrow()
      expect(row.deletedAt).not.toBeNull()
    })

    it("should throw 404 if the redirect does not exist", async () => {
      // Arrange / Act
      const result = caller.delete({ siteId, id: "999999" })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "NOT_FOUND", message: "Redirect not found" }),
      )
    })

    it("should throw 404 if the redirect is already deleted", async () => {
      // Arrange
      const inserted = await db
        .insertInto("Redirect")
        .values({
          siteId,
          source: "/gone",
          destination: "/dest",
          deletedAt: new Date(),
        })
        .returning("id")
        .executeTakeFirstOrThrow()

      // Act
      const result = caller.delete({ siteId, id: inserted.id })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "NOT_FOUND", message: "Redirect not found" }),
      )
    })

    it("should not delete redirects belonging to other sites", async () => {
      // Arrange
      const { site: otherSite } = await setupSite()
      const inserted = await db
        .insertInto("Redirect")
        .values({
          siteId: otherSite.id,
          source: "/safe",
          destination: "/dest",
        })
        .returning("id")
        .executeTakeFirstOrThrow()

      // Act
      const result = caller.delete({ siteId, id: inserted.id })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "NOT_FOUND", message: "Redirect not found" }),
      )
      const row = await db
        .selectFrom("Redirect")
        .select("deletedAt")
        .where("id", "=", inserted.id)
        .executeTakeFirstOrThrow()
      expect(row.deletedAt).toBeNull()
    })

    it("should write an audit log entry with the deleted row", async () => {
      // Arrange
      const inserted = await db
        .insertInto("Redirect")
        .values({ siteId, source: "/bye", destination: "/x" })
        .returning("id")
        .executeTakeFirstOrThrow()

      // Act
      await caller.delete({ siteId, id: inserted.id })

      // Assert
      const auditEntry = await db
        .selectFrom("AuditLog")
        .selectAll()
        .where("siteId", "=", siteId)
        .where("eventType", "=", "Publish")
        .executeTakeFirstOrThrow()
      expect(auditEntry.userId).toBe(session.userId)
      expect(auditEntry.metadata).toMatchObject({
        redirects: {
          deleted: [{ source: "/bye", destination: "/x" }],
        },
      })
    })
  })
})
