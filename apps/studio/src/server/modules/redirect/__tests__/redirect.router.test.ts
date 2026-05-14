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
      const result = unauthedCaller.list({ siteId })
      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should return empty list when no redirects exist", async () => {
      const result = await caller.list({ siteId })
      expect(result.items).toEqual([])
      expect(result.totalCount).toBe(0)
    })

    it("should return redirects with correct shape", async () => {
      await db
        .insertInto("Redirect")
        .values({ siteId, source: "/old", destination: "/new" })
        .execute()

      const result = await caller.list({ siteId })
      expect(result.items).toHaveLength(1)
      expect(result.totalCount).toBe(1)
      expect(result.items[0]).toMatchObject({
        source: "/old",
        destination: "/new",
        status: "active",
        hasUnpublishedChanges: false,
      })
      expect(result.items[0]!.publishedAt).toBeInstanceOf(Date)
      expect(typeof result.items[0]!.id).toBe("string")
    })

    it("should include soft-deleted redirects with deleted status", async () => {
      await db
        .insertInto("Redirect")
        .values({
          siteId,
          source: "/removed",
          destination: "/gone",
          deletedAt: new Date(),
        })
        .execute()

      const result = await caller.list({ siteId })
      expect(result.items).toHaveLength(1)
      expect(result.items[0]).toMatchObject({
        source: "/removed",
        status: "deleted",
      })
    })

    it("should paginate results", async () => {
      for (let i = 0; i < 5; i++) {
        await db
          .insertInto("Redirect")
          .values({
            siteId,
            source: `/page-${i}`,
            destination: `/new-${i}`,
          })
          .execute()
      }

      const page1 = await caller.list({ siteId, page: 1, pageSize: 2 })
      expect(page1.items).toHaveLength(2)
      expect(page1.totalCount).toBe(5)

      const page3 = await caller.list({ siteId, page: 3, pageSize: 2 })
      expect(page3.items).toHaveLength(1)
      expect(page3.totalCount).toBe(5)
    })

    it("should sort by source ascending", async () => {
      await db
        .insertInto("Redirect")
        .values([
          { siteId, source: "/b-page", destination: "/x" },
          { siteId, source: "/a-page", destination: "/y" },
        ])
        .execute()

      const result = await caller.list({
        siteId,
        sortBy: "source",
        sortDirection: "asc",
      })
      expect(result.items[0]!.source).toBe("/a-page")
      expect(result.items[1]!.source).toBe("/b-page")
    })

    it("should not return redirects from other sites", async () => {
      const { site: otherSite } = await setupSite()
      await db
        .insertInto("Redirect")
        .values({
          siteId: otherSite.id,
          source: "/other",
          destination: "/elsewhere",
        })
        .execute()

      const result = await caller.list({ siteId })
      expect(result.items).toHaveLength(0)
      expect(result.totalCount).toBe(0)
    })
  })

  describe("publish", () => {
    it("should throw 401 if not logged in", async () => {
      const result = unauthedCaller.publish({
        siteId,
        creates: [],
        deletes: [],
      })
      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should insert new redirects", async () => {
      await caller.publish({
        siteId,
        creates: [{ source: "/old", destination: "/new" }],
        deletes: [],
      })

      const result = await caller.list({ siteId })
      expect(result.items).toHaveLength(1)
      expect(result.items[0]).toMatchObject({
        source: "/old",
        destination: "/new",
        status: "active",
      })
    })

    it("should soft-delete redirects", async () => {
      const inserted = await db
        .insertInto("Redirect")
        .values({ siteId, source: "/remove-me", destination: "/dest" })
        .returning("id")
        .executeTakeFirstOrThrow()

      await caller.publish({
        siteId,
        creates: [],
        deletes: [String(inserted.id)],
      })

      const result = await caller.list({ siteId })
      expect(result.items).toHaveLength(1)
      expect(result.items[0]).toMatchObject({
        source: "/remove-me",
        status: "deleted",
      })
    })

    it("should upsert when source conflicts with existing redirect", async () => {
      await db
        .insertInto("Redirect")
        .values({ siteId, source: "/page", destination: "/old-dest" })
        .execute()

      await caller.publish({
        siteId,
        creates: [{ source: "/page", destination: "/new-dest" }],
        deletes: [],
      })

      const result = await caller.list({ siteId })
      const active = result.items.filter((r) => r.status === "active")
      expect(active).toHaveLength(1)
      expect(active[0]).toMatchObject({
        source: "/page",
        destination: "/new-dest",
      })
    })

    it("should revive a soft-deleted redirect on upsert", async () => {
      await db
        .insertInto("Redirect")
        .values({
          siteId,
          source: "/revived",
          destination: "/old",
          deletedAt: new Date(),
        })
        .execute()

      await caller.publish({
        siteId,
        creates: [{ source: "/revived", destination: "/new" }],
        deletes: [],
      })

      const result = await caller.list({ siteId })
      expect(result.items).toHaveLength(1)
      expect(result.items[0]).toMatchObject({
        source: "/revived",
        destination: "/new",
        status: "active",
      })
    })

    it("should handle creates and deletes in one publish", async () => {
      const inserted = await db
        .insertInto("Redirect")
        .values({ siteId, source: "/old-page", destination: "/x" })
        .returning("id")
        .executeTakeFirstOrThrow()

      await caller.publish({
        siteId,
        creates: [{ source: "/new-page", destination: "/y" }],
        deletes: [String(inserted.id)],
      })

      const result = await caller.list({ siteId })
      expect(result.items).toHaveLength(2)

      const active = result.items.filter((r) => r.status === "active")
      const deleted = result.items.filter((r) => r.status === "deleted")
      expect(active).toHaveLength(1)
      expect(active[0]!.source).toBe("/new-page")
      expect(deleted).toHaveLength(1)
      expect(deleted[0]!.source).toBe("/old-page")
    })

    it("should not soft-delete redirects from other sites", async () => {
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

      await caller.publish({
        siteId,
        creates: [],
        deletes: [String(inserted.id)],
      })

      const row = await db
        .selectFrom("Redirect")
        .select(["deletedAt"])
        .where("id", "=", String(inserted.id))
        .executeTakeFirstOrThrow()

      expect(row.deletedAt).toBeNull()
    })

    it("should be a no-op when creates and deletes are both empty", async () => {
      await caller.publish({ siteId, creates: [], deletes: [] })
      const result = await caller.list({ siteId })
      expect(result.items).toHaveLength(0)
    })
  })
})
