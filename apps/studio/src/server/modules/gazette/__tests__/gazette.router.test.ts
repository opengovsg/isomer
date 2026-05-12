import { TRPCError } from "@trpc/server"
import { subDays } from "date-fns"
import MockDate from "mockdate"
import { auth } from "tests/integration/helpers/auth"
import { resetTables } from "tests/integration/helpers/db"
import {
  applyAuthedSession,
  applySession,
  createMockRequest,
} from "tests/integration/helpers/iron-session"
import {
  setupAdminPermissions,
  setupCollection,
  setupCollectionLink,
  setupIsomerAdmin,
  setupUser,
} from "tests/integration/helpers/seed"
import { v4 as uuidv4 } from "uuid"
import { describe, expect, it } from "vitest"
import { createCallerFactory } from "~/server/trpc"
import { IsomerAdminRole, ResourceType } from "~prisma/generated/generatedEnums"

import { db } from "../../database"
import { gazetteRouter } from "../gazette.router"

const createCaller = createCallerFactory(gazetteRouter)

describe("gazette.router", async () => {
  let caller: ReturnType<typeof createCaller>
  const session = await applyAuthedSession()

  // Frozen "now" so past/future timestamps are deterministic.
  const FIXED_NOW = new Date("2026-04-30T12:00:00.000Z")
  const PAST_DATE = subDays(FIXED_NOW, 1)

  beforeEach(async () => {
    MockDate.set(FIXED_NOW)
    await resetTables(
      "AuditLog",
      "ResourcePermission",
      "Blob",
      "Version",
      "Resource",
      "Site",
      "IsomerAdmin",
      "User",
    )
    caller = createCaller(createMockRequest(session))
  })

  afterEach(() => {
    MockDate.reset()
  })

  /**
   * Set up a Toppan user with admin permissions on a fresh site, plus a
   * collection that gazettes can hang off of. Returns ids the tests use.
   */
  const seedToppanWithCollection = async () => {
    const user = await setupUser({
      userId: session.userId ?? undefined,
      email: "user@toppannext.com",
    })
    await auth(user)
    const { site, collection } = await setupCollection({})
    await setupAdminPermissions({
      userId: session.userId ?? undefined,
      siteId: site.id,
    })
    return { user, site, collection }
  }

  describe("assertGazetteAccess (via gazette.list)", () => {
    it("rejects an ordinary site member with no Toppan email and no admin role", async () => {
      const user = await setupUser({
        userId: session.userId ?? undefined,
        email: "user@example.com",
      })
      await auth(user)
      const { site, collection } = await setupCollection({})
      await setupAdminPermissions({
        userId: session.userId ?? undefined,
        siteId: site.id,
      })

      await expect(
        caller.list({
          siteId: site.id,
          collectionId: Number(collection.id),
          limit: 10,
          offset: 0,
        }),
      ).rejects.toThrowError(
        new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to the gazette feature",
        }),
      )
    })

    it("allows an IsomerAdmin Core user even without a Toppan email", async () => {
      const user = await setupUser({
        userId: session.userId ?? undefined,
        email: "admin@example.com",
      })
      await auth(user)
      await setupIsomerAdmin({ userId: user.id, role: IsomerAdminRole.Core })
      const { site, collection } = await setupCollection({})
      await setupAdminPermissions({
        userId: session.userId ?? undefined,
        siteId: site.id,
      })

      const result = await caller.list({
        siteId: site.id,
        collectionId: Number(collection.id),
        limit: 10,
        offset: 0,
      })
      expect(result).toEqual([])
    })

    it("allows a Toppan-email user", async () => {
      const { site, collection } = await seedToppanWithCollection()

      const result = await caller.list({
        siteId: site.id,
        collectionId: Number(collection.id),
        limit: 10,
        offset: 0,
      })
      expect(result).toEqual([])
    })

    it("rejects an unauthenticated caller before access is even evaluated", async () => {
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      await expect(
        unauthedCaller.list({
          siteId: 1,
          collectionId: 1,
          limit: 10,
          offset: 0,
        }),
      ).rejects.toThrowError(new TRPCError({ code: "UNAUTHORIZED" }))
    })
  })

  describe("create", () => {
    it("creates a gazette resource + blob + audit entries in one transaction", async () => {
      const { site, collection, user } = await seedToppanWithCollection()

      const { gazetteId } = await caller.create({
        siteId: site.id,
        collectionId: Number(collection.id),
        title: "Notice 123",
        permalink: uuidv4(),
        ref: "/1/abc/notice-123.pdf",
        category: "Government Gazette",
        date: "30/04/2026",
        description: "Notif #123",
        tagged: ["sub-1"],
        scheduledAt: PAST_DATE,
      })

      // Resource was inserted with the past scheduledAt straight from the
      // input — no future-only validation, no rewrite to null.
      const resource = await db
        .selectFrom("Resource")
        .where("id", "=", String(gazetteId))
        .selectAll()
        .executeTakeFirstOrThrow()
      expect(resource.parentId).toBe(String(collection.id))
      expect(resource.type).toBe(ResourceType.CollectionLink)
      expect(resource.scheduledAt).toEqual(PAST_DATE)
      expect(resource.scheduledBy).toBe(user.id)

      // Blob carries the gazette metadata. Note we deliberately do NOT
      // store fileSize here — it stays a runtime S3 HEAD lookup so the
      // BlobJsonContent contract with the components package isn't
      // polluted with feature-specific fields.
      const blob = await db
        .selectFrom("Blob")
        .where("id", "=", resource.draftBlobId)
        .selectAll()
        .executeTakeFirstOrThrow()
      const page = (blob.content as { page?: { ref?: string } } | null)?.page
      expect(page?.ref).toBe("/1/abc/notice-123.pdf")

      // Both audit entries (resource create + schedule publish) emitted.
      const auditLogs = await db.selectFrom("AuditLog").selectAll().execute()
      expect(auditLogs).toHaveLength(2)
    })

    it("rejects a non-Toppan, non-admin caller before any DB writes", async () => {
      const user = await setupUser({
        userId: session.userId ?? undefined,
        email: "user@example.com",
      })
      await auth(user)
      const { site, collection } = await setupCollection({})
      await setupAdminPermissions({
        userId: session.userId ?? undefined,
        siteId: site.id,
      })

      await expect(
        caller.create({
          siteId: site.id,
          collectionId: Number(collection.id),
          title: "Notice 123",
          permalink: uuidv4(),
          ref: "/1/abc/notice.pdf",
          category: "Government Gazette",
          date: "30/04/2026",
          tagged: ["sub-1"],
          scheduledAt: PAST_DATE,
        }),
      ).rejects.toThrowError(
        new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to the gazette feature",
        }),
      )

      const resources = await db.selectFrom("Resource").selectAll().execute()
      // Only the collection itself exists — no link was created.
      expect(resources.map((r) => r.type)).toEqual([ResourceType.Collection])
    })
  })

  describe("update", () => {
    it("rewrites the blob metadata and the resource title", async () => {
      const { site, collection, user } = await seedToppanWithCollection()
      const { gazetteId } = await caller.create({
        siteId: site.id,
        collectionId: Number(collection.id),
        title: "Original",
        permalink: uuidv4(),
        ref: "/1/abc/notice.pdf",
        category: "Government Gazette",
        date: "30/04/2026",
        description: "old-desc",
        tagged: ["sub-1"],
        scheduledAt: PAST_DATE,
      })

      await caller.update({
        siteId: site.id,
        gazetteId: Number(gazetteId),
        title: "Renamed",
        newRef: "/1/abc/replacement.pdf",
        category: "Other Supplements",
        date: "30/04/2026",
        description: "new-desc",
        tagged: ["sub-2"],
        scheduledAt: PAST_DATE,
      })

      const resource = await db
        .selectFrom("Resource")
        .where("id", "=", String(gazetteId))
        .selectAll()
        .executeTakeFirstOrThrow()
      expect(resource.title).toBe("Renamed")
      expect(resource.scheduledBy).toBe(user.id)

      const blob = await db
        .selectFrom("Blob")
        .where("id", "=", resource.draftBlobId)
        .selectAll()
        .executeTakeFirstOrThrow()
      const page = (
        blob.content as {
          page?: {
            ref?: string
            category?: string
            description?: string
            tagged?: string[]
          }
        } | null
      )?.page
      expect(page?.ref).toBe("/1/abc/replacement.pdf")
      expect(page?.category).toBe("Other Supplements")
      expect(page?.description).toBe("new-desc")
      expect(page?.tagged).toEqual(["sub-2"])
    })

    it("accepts a past scheduledAt on update (mirrors create's contract)", async () => {
      const { site, collection } = await seedToppanWithCollection()
      const futureScheduledAt = new Date(FIXED_NOW.getTime() + 60 * 60 * 1000)

      // Seed a link directly so we don't need to mock the email side-effect.
      const { collectionLink } = await setupCollectionLink({
        siteId: site.id,
        collectionId: collection.id,
        permalink: "egazette-link",
      })
      // Set a future schedule on it so the update test moves it backwards.
      await db
        .updateTable("Resource")
        .where("id", "=", collectionLink.id)
        .set({ scheduledAt: futureScheduledAt })
        .execute()

      await caller.update({
        siteId: site.id,
        gazetteId: Number(collectionLink.id),
        title: "ImmediatePublish",
        category: "Government Gazette",
        date: "30/04/2026",
        tagged: ["sub-1"],
        scheduledAt: PAST_DATE,
      })

      const after = await db
        .selectFrom("Resource")
        .where("id", "=", collectionLink.id)
        .selectAll()
        .executeTakeFirstOrThrow()
      expect(after.scheduledAt).toEqual(PAST_DATE)
    })
  })
})
