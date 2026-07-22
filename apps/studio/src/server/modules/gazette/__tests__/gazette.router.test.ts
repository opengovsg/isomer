import { TRPCError } from "@trpc/server"
import { subDays, subMinutes } from "date-fns"
import MockDate from "mockdate"
import { auth } from "tests/integration/helpers/auth"
import { resetTables } from "tests/integration/helpers/db"
import { mockFeatureFlags } from "tests/integration/helpers/growthbook/mockFeatureFlags"
import { mockGrowthBook } from "tests/integration/helpers/growthbook/mockInstance"
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
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { env } from "~/env.mjs"
import * as mailService from "~/features/mail/service"
import { ENABLE_SEARCHSG_GAZETTE_INGESTION } from "~/lib/growthbook"
import * as s3Lib from "~/lib/s3"
import { createCallerFactory } from "~/server/trpc"
import {
  AuditLogEvent,
  IsomerAdminRole,
  ResourceType,
} from "~prisma/generated/generatedEnums"

// algolia.ts constructs the Algolia client at module load via
// algoliasearch(env.ALGOLIA_APP_ID, env.ALGOLIA_API_KEY). Those env vars are
// not set in the test environment, so the import throws "appId is missing"
// before any test runs. Mock the whole module to prevent this.
vi.mock("~/lib/algolia")

import { db } from "../../database"
import { gazetteRouter } from "../gazette.router"
import * as gazetteService from "../gazette.service"

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
      "PushDocumentJob",
      "AuditLog",
      "ResourcePermission",
      "Version",
      "Blob",
      "Resource",
      "Site",
      "IsomerAdmin",
      "User",
    )
    caller = createCaller(createMockRequest(session))
  })

  afterEach(() => {
    MockDate.reset()
    // Restore vi.spyOn-installed spies so call history doesn't bleed across
    // tests — vitest reuses an existing spy when spyOn is called on an
    // already-spied method, which would otherwise let test 1's calls show up
    // in test 2's mock.calls[0].
    vi.restoreAllMocks()
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
      // Arrange
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

      // Act & Assert
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
      // Arrange
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

      // Act
      const result = await caller.list({
        siteId: site.id,
        collectionId: Number(collection.id),
        limit: 10,
        offset: 0,
      })

      // Assert
      expect(result).toEqual([])
    })

    it("allows a Toppan-email user", async () => {
      // Arrange
      const { site, collection } = await seedToppanWithCollection()

      // Act
      const result = await caller.list({
        siteId: site.id,
        collectionId: Number(collection.id),
        limit: 10,
        offset: 0,
      })

      // Assert
      expect(result).toEqual([])
    })

    it("rejects an unauthenticated caller before access is even evaluated", async () => {
      // Arrange
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      // Act & Assert
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
      // Arrange
      const { site, collection, user } = await seedToppanWithCollection()

      // Act
      const { gazetteId } = await caller.create({
        siteId: site.id,
        collectionId: Number(collection.id),
        title: "Notice 123",
        permalink: crypto.randomUUID(),
        ref: "/1/abc/notice-123.pdf",
        category: "Government Gazette",
        date: "30/04/2026",
        description: "Notif #123",
        tagged: ["sub-1"],
        scheduledAt: PAST_DATE,
      })

      // Assert
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
      // Arrange
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

      // Act & Assert
      await expect(
        caller.create({
          siteId: site.id,
          collectionId: Number(collection.id),
          title: "Notice 123",
          permalink: crypto.randomUUID(),
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

    it("rejects creation when a gazette with the same file ID already exists", async () => {
      // Arrange
      const { site, collection } = await seedToppanWithCollection()

      // Create first gazette with a specific filename
      await caller.create({
        siteId: site.id,
        collectionId: Number(collection.id),
        title: "First Notice",
        permalink: crypto.randomUUID(),
        ref: "/sites/1/gazettes/uuid1/duplicate-file.pdf",
        category: "Government Gazette",
        date: "30/04/2026",
        tagged: ["sub-1"],
        scheduledAt: PAST_DATE,
      })

      // Act & Assert: creating a second gazette with the same filename is rejected
      await expect(
        caller.create({
          siteId: site.id,
          collectionId: Number(collection.id),
          title: "Second Notice",
          permalink: crypto.randomUUID(),
          ref: "/sites/1/gazettes/uuid2/duplicate-file.pdf", // Same filename
          category: "Government Gazette",
          date: "30/04/2026",
          tagged: ["sub-1"],
          scheduledAt: PAST_DATE,
        }),
      ).rejects.toThrowError(
        new TRPCError({
          code: "CONFLICT",
          message: "A gazette with the same file ID already exists",
        }),
      )
    })

    it("rejects creation when a gazette with the same notification number already exists", async () => {
      // Arrange
      const { site, collection } = await seedToppanWithCollection()

      // Create first gazette with a specific notification number
      await caller.create({
        siteId: site.id,
        collectionId: Number(collection.id),
        title: "First Notice",
        permalink: crypto.randomUUID(),
        ref: "/sites/1/gazettes/uuid1/first-file.pdf",
        category: "Government Gazette",
        date: "30/04/2026",
        description: "N-2026-001",
        tagged: ["sub-1"],
        scheduledAt: PAST_DATE,
      })

      // Act & Assert: creating a second gazette with the same notification number is rejected
      await expect(
        caller.create({
          siteId: site.id,
          collectionId: Number(collection.id),
          title: "Second Notice",
          permalink: crypto.randomUUID(),
          ref: "/sites/1/gazettes/uuid2/second-file.pdf", // Different filename
          category: "Government Gazette",
          date: "30/04/2026",
          description: "N-2026-001", // Same notification number
          tagged: ["sub-1"],
          scheduledAt: PAST_DATE,
        }),
      ).rejects.toThrowError(
        new TRPCError({
          code: "CONFLICT",
          message: "A gazette with the same notification number already exists",
        }),
      )
    })

    it("rejects creation for a non-Government Gazette category when notification number, year and subcategory all match", async () => {
      // Arrange
      const { site, collection } = await seedToppanWithCollection()

      await caller.create({
        siteId: site.id,
        collectionId: Number(collection.id),
        title: "First Supplement",
        permalink: crypto.randomUUID(),
        ref: "/sites/1/gazettes/uuid1/first-file.pdf",
        category: "Legislative Supplements",
        date: "30/04/2026",
        description: "N-2026-001",
        tagged: ["Acts Supplement"],
        scheduledAt: PAST_DATE,
      })

      // Act & Assert: same notification number + same year + same subcategory is a duplicate
      await expect(
        caller.create({
          siteId: site.id,
          collectionId: Number(collection.id),
          title: "Second Supplement",
          permalink: crypto.randomUUID(),
          ref: "/sites/1/gazettes/uuid2/second-file.pdf", // Different filename
          category: "Legislative Supplements",
          date: "30/04/2026",
          description: "N-2026-001", // Same notification number
          tagged: ["Acts Supplement"], // Same subcategory
          scheduledAt: PAST_DATE,
        }),
      ).rejects.toThrowError(
        new TRPCError({
          code: "CONFLICT",
          message: "A gazette with the same notification number already exists",
        }),
      )
    })

    it("allows creation for a non-Government Gazette category when the subcategory differs, even with the same notification number and year", async () => {
      // Arrange
      const { site, collection } = await seedToppanWithCollection()

      await caller.create({
        siteId: site.id,
        collectionId: Number(collection.id),
        title: "First Supplement",
        permalink: crypto.randomUUID(),
        ref: "/sites/1/gazettes/uuid1/first-file.pdf",
        category: "Legislative Supplements",
        date: "30/04/2026",
        description: "N-2026-001",
        tagged: ["Acts Supplement"],
        scheduledAt: PAST_DATE,
      })

      // Act: same notification number + same year but a different subcategory.
      // For non-Government Gazette categories the subcategory disambiguates, so
      // this is not a duplicate and must be allowed.
      const { gazetteId } = await caller.create({
        siteId: site.id,
        collectionId: Number(collection.id),
        title: "Second Supplement",
        permalink: crypto.randomUUID(),
        ref: "/sites/1/gazettes/uuid2/second-file.pdf",
        category: "Legislative Supplements",
        date: "30/04/2026",
        description: "N-2026-001", // Same notification number
        tagged: ["Bills Supplement"], // Different subcategory
        scheduledAt: PAST_DATE,
      })

      // Assert: the second gazette was created
      const resource = await db
        .selectFrom("Resource")
        .where("id", "=", String(gazetteId))
        .selectAll()
        .executeTakeFirstOrThrow()
      expect(resource.title).toBe("Second Supplement")
    })
  })

  describe("update", () => {
    it("rewrites the blob metadata and the resource title", async () => {
      // Arrange
      const { site, collection, user } = await seedToppanWithCollection()
      const { gazetteId } = await caller.create({
        siteId: site.id,
        collectionId: Number(collection.id),
        title: "Original",
        permalink: crypto.randomUUID(),
        ref: "/1/abc/notice.pdf",
        category: "Government Gazette",
        date: "30/04/2026",
        description: "old-desc",
        tagged: ["sub-1"],
        scheduledAt: PAST_DATE,
      })

      const markFileAsDeleted = vi
        .spyOn(gazetteService, "markFileAsDeleted")
        .mockResolvedValue(undefined)

      // Act
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

      // Assert
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

      // The superseded file (a different key) is soft-deleted after commit.
      expect(markFileAsDeleted).toHaveBeenCalledExactlyOnceWith({
        key: "1/abc/notice.pdf",
      })
    })

    it("does not soft-delete the S3 object when the new ref matches the existing ref", async () => {
      // Arrange: S3 keys are deterministic (year/category/subcategory/filename),
      // so re-uploading a replacement file without changing its metadata lands
      // on the SAME key — cleanup must be skipped or it tombstones the live file.
      const { site, collection } = await seedToppanWithCollection()
      const { gazetteId } = await caller.create({
        siteId: site.id,
        collectionId: Number(collection.id),
        title: "Original",
        permalink: crypto.randomUUID(),
        ref: "/2026/Government Gazette/sub-1/notice.pdf",
        category: "Government Gazette",
        date: "30/04/2026",
        tagged: ["sub-1"],
        scheduledAt: PAST_DATE,
      })
      const markFileAsDeleted = vi
        .spyOn(gazetteService, "markFileAsDeleted")
        .mockResolvedValue(undefined)

      // Act: re-upload to the same key
      await caller.update({
        siteId: site.id,
        gazetteId: Number(gazetteId),
        title: "Original",
        newRef: "/2026/Government Gazette/sub-1/notice.pdf",
        category: "Government Gazette",
        date: "30/04/2026",
        tagged: ["sub-1"],
        scheduledAt: PAST_DATE,
      })

      // Assert: the gazette still points at the ref, and it was never tombstoned
      expect(markFileAsDeleted).not.toHaveBeenCalled()
      const resource = await db
        .selectFrom("Resource")
        .where("id", "=", String(gazetteId))
        .selectAll()
        .executeTakeFirstOrThrow()
      const blob = await db
        .selectFrom("Blob")
        .where("id", "=", resource.draftBlobId)
        .selectAll()
        .executeTakeFirstOrThrow()
      expect(
        (blob.content as { page?: { ref?: string } } | null)?.page?.ref,
      ).toBe("/2026/Government Gazette/sub-1/notice.pdf")
    })

    it("accepts a past scheduledAt on update (mirrors create's contract)", async () => {
      // Arrange
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

      // Act
      await caller.update({
        siteId: site.id,
        gazetteId: Number(collectionLink.id),
        title: "ImmediatePublish",
        category: "Government Gazette",
        date: "30/04/2026",
        tagged: ["sub-1"],
        scheduledAt: PAST_DATE,
      })

      // Assert
      const after = await db
        .selectFrom("Resource")
        .where("id", "=", collectionLink.id)
        .selectAll()
        .executeTakeFirstOrThrow()
      expect(after.scheduledAt).toEqual(PAST_DATE)
    })

    it("rejects update when changing to a file ID that already exists", async () => {
      // Arrange
      const { site, collection } = await seedToppanWithCollection()

      // Create first gazette
      await caller.create({
        siteId: site.id,
        collectionId: Number(collection.id),
        title: "First Notice",
        permalink: crypto.randomUUID(),
        ref: "/sites/1/gazettes/uuid1/existing-file.pdf",
        category: "Government Gazette",
        date: "30/04/2026",
        tagged: ["sub-1"],
        scheduledAt: PAST_DATE,
      })

      // Create second gazette with a different filename
      const { gazetteId } = await caller.create({
        siteId: site.id,
        collectionId: Number(collection.id),
        title: "Second Notice",
        permalink: crypto.randomUUID(),
        ref: "/sites/1/gazettes/uuid2/different-file.pdf",
        category: "Government Gazette",
        date: "30/04/2026",
        tagged: ["sub-1"],
        scheduledAt: PAST_DATE,
      })

      // Act & Assert: updating to a filename already used by another gazette is rejected
      await expect(
        caller.update({
          siteId: site.id,
          gazetteId: Number(gazetteId),
          title: "Second Notice",
          newRef: "/sites/1/gazettes/uuid3/existing-file.pdf", // Same filename as first
          category: "Government Gazette",
          date: "30/04/2026",
          tagged: ["sub-1"],
          scheduledAt: PAST_DATE,
        }),
      ).rejects.toThrowError(
        new TRPCError({
          code: "CONFLICT",
          message: "A gazette with the same file ID already exists",
        }),
      )
    })

    it("rejects update when changing to a notification number that already exists", async () => {
      // Arrange
      const { site, collection } = await seedToppanWithCollection()

      // Create first gazette with a notification number
      await caller.create({
        siteId: site.id,
        collectionId: Number(collection.id),
        title: "First Notice",
        permalink: crypto.randomUUID(),
        ref: "/sites/1/gazettes/uuid1/first-file.pdf",
        category: "Government Gazette",
        date: "30/04/2026",
        description: "N-2026-001",
        tagged: ["sub-1"],
        scheduledAt: PAST_DATE,
      })

      // Create second gazette with a different notification number
      const { gazetteId } = await caller.create({
        siteId: site.id,
        collectionId: Number(collection.id),
        title: "Second Notice",
        permalink: crypto.randomUUID(),
        ref: "/sites/1/gazettes/uuid2/second-file.pdf",
        category: "Government Gazette",
        date: "30/04/2026",
        description: "N-2026-002",
        tagged: ["sub-1"],
        scheduledAt: PAST_DATE,
      })

      // Act & Assert: updating to a notification number used by another gazette is rejected
      await expect(
        caller.update({
          siteId: site.id,
          gazetteId: Number(gazetteId),
          title: "Second Notice",
          category: "Government Gazette",
          date: "30/04/2026",
          description: "N-2026-001", // Same notification number as first
          tagged: ["sub-1"],
          scheduledAt: PAST_DATE,
        }),
      ).rejects.toThrowError(
        new TRPCError({
          code: "CONFLICT",
          message: "A gazette with the same notification number already exists",
        }),
      )
    })

    it("allows update that keeps the gazette's own notification number", async () => {
      // Arrange
      const { site, collection } = await seedToppanWithCollection()
      const { gazetteId } = await caller.create({
        siteId: site.id,
        collectionId: Number(collection.id),
        title: "Original",
        permalink: crypto.randomUUID(),
        ref: "/sites/1/gazettes/uuid1/file.pdf",
        category: "Government Gazette",
        date: "30/04/2026",
        description: "N-2026-001",
        tagged: ["sub-1"],
        scheduledAt: PAST_DATE,
      })

      // Act: editing other fields while retaining the same notification number
      // must not trip the duplicate check against the gazette's own record.
      await caller.update({
        siteId: site.id,
        gazetteId: Number(gazetteId),
        title: "Renamed",
        category: "Government Gazette",
        date: "30/04/2026",
        description: "N-2026-001", // Unchanged
        tagged: ["sub-1"],
        scheduledAt: PAST_DATE,
      })

      // Assert
      const resource = await db
        .selectFrom("Resource")
        .where("id", "=", String(gazetteId))
        .selectAll()
        .executeTakeFirstOrThrow()
      expect(resource.title).toBe("Renamed")
    })
  })

  describe("cancelScheduledPublish", () => {
    it("deletes the resource, blob, and push job atomically and emits both audit events", async () => {
      const { site, collection, user } = await seedToppanWithCollection()
      // S3 tagging is best-effort post-tx — stub so the test stays offline.
      const markCancelled = vi
        .spyOn(s3Lib, "markScheduledAssetAsCancelled")
        .mockResolvedValue({} as never)

      const { gazetteId } = await caller.create({
        siteId: site.id,
        collectionId: Number(collection.id),
        title: "About to cancel",
        permalink: crypto.randomUUID(),
        ref: "/1/abc/about-to-cancel.pdf",
        category: "Government Gazette",
        date: "30/04/2026",
        tagged: ["sub-1"],
        scheduledAt: PAST_DATE,
      })

      const beforeBlob = await db
        .selectFrom("Resource")
        .where("id", "=", String(gazetteId))
        .select("draftBlobId")
        .executeTakeFirstOrThrow()

      // Seed the PushDocumentJob row that create() inserts.
      const pushJobBefore = await db
        .selectFrom("PushDocumentJob")
        .where("resourceId", "=", String(gazetteId))
        .selectAll()
        .execute()
      expect(pushJobBefore).toHaveLength(1)

      // AuditLog is append-only at the DB level (no DELETE permission), so
      // capture the current high-water-mark id and assert on rows after it.
      const lastIdBeforeCancel = await db
        .selectFrom("AuditLog")
        .select(({ fn }) => fn.max("id").as("maxId"))
        .executeTakeFirstOrThrow()

      await caller.cancelScheduledPublish({
        siteId: site.id,
        gazetteId: Number(gazetteId),
      })

      const resourceAfter = await db
        .selectFrom("Resource")
        .where("id", "=", String(gazetteId))
        .selectAll()
        .execute()
      expect(resourceAfter).toHaveLength(0)

      const blobAfter = beforeBlob.draftBlobId
        ? await db
            .selectFrom("Blob")
            .where("id", "=", beforeBlob.draftBlobId)
            .selectAll()
            .execute()
        : []
      expect(blobAfter).toHaveLength(0)

      const pushJobAfter = await db
        .selectFrom("PushDocumentJob")
        .where("resourceId", "=", String(gazetteId))
        .selectAll()
        .execute()
      expect(pushJobAfter).toHaveLength(0)

      const newAuditLogsQuery = db
        .selectFrom("AuditLog")
        .selectAll()
        .orderBy("id", "asc")
      const newAuditLogs = lastIdBeforeCancel.maxId
        ? await newAuditLogsQuery
            .where("id", ">", lastIdBeforeCancel.maxId)
            .execute()
        : await newAuditLogsQuery.execute()
      const eventTypes = newAuditLogs.map((l) => l.eventType)
      expect(eventTypes).toContain(AuditLogEvent.CancelSchedulePublish)
      expect(eventTypes).toContain(AuditLogEvent.ResourceDelete)

      // The CancelSchedulePublish delta records the deleted PushDocumentJob
      // as `before` (truthful: that's the row that was cancelled), with
      // `after: null` since the job is gone.
      const cancelLog = newAuditLogs.find(
        (l) => l.eventType === AuditLogEvent.CancelSchedulePublish,
      )
      const delta = cancelLog?.delta as {
        before: {
          resourceId: string
          scheduledAt: unknown
          scheduledBy: string
        }
        after: null
      }
      expect(delta.before.resourceId).toBe(String(gazetteId))
      expect(delta.before.scheduledAt).not.toBeNull()
      expect(delta.before.scheduledBy).toBe(user.id)
      expect(delta.after).toBeNull()

      // S3 was instructed to tag the asset as cancelled.
      expect(markCancelled).toHaveBeenCalledTimes(1)
    })

    it("rejects a gazette that is not currently scheduled", async () => {
      const { site, collection } = await seedToppanWithCollection()
      const { collectionLink } = await setupCollectionLink({
        siteId: site.id,
        collectionId: collection.id,
        permalink: "not-scheduled",
      })

      await expect(
        caller.cancelScheduledPublish({
          siteId: site.id,
          gazetteId: Number(collectionLink.id),
        }),
      ).rejects.toThrowError(
        new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot cancel a gazette that is not scheduled",
        }),
      )
    })

    it("tolerates S3 tagging failure (best-effort post-commit)", async () => {
      const { site, collection } = await seedToppanWithCollection()
      vi.spyOn(s3Lib, "markScheduledAssetAsCancelled").mockRejectedValue(
        new Error("S3 unavailable"),
      )

      const { gazetteId } = await caller.create({
        siteId: site.id,
        collectionId: Number(collection.id),
        title: "S3 will fail",
        permalink: crypto.randomUUID(),
        ref: "/1/abc/s3-fail.pdf",
        category: "Government Gazette",
        date: "30/04/2026",
        tagged: ["sub-1"],
        scheduledAt: PAST_DATE,
      })

      // Should NOT throw — DB tx commits first, S3 is best-effort.
      await expect(
        caller.cancelScheduledPublish({
          siteId: site.id,
          gazetteId: Number(gazetteId),
        }),
      ).resolves.toBeDefined()

      const resourceAfter = await db
        .selectFrom("Resource")
        .where("id", "=", String(gazetteId))
        .selectAll()
        .execute()
      expect(resourceAfter).toHaveLength(0)
    })
  })

  describe("getPresignedPutUrl", () => {
    it("passes the supplied tags through to the underlying signer", async () => {
      const { site, collection } = await seedToppanWithCollection()
      const signedPutSpy = vi
        .spyOn(s3Lib, "generateSignedPutUrl")
        .mockResolvedValue("https://signed.example/put")

      const result = await caller.getPresignedPutUrl({
        siteId: site.id,
        resourceId: collection.id,
        year: 2026,
        category: "Government Gazette",
        subcategory: "Public",
        fileName: "notice-1.pdf",
        fileSize: 1234,
        tags: [{ key: "scheduledAt", value: "1700000000000" }],
      })

      expect(result.presignedPutUrl).toBe("https://signed.example/put")
      expect(result.fileKey).toMatch(
        /^2026\/Government Gazette\/Public\/notice-1\.pdf$/,
      )
      expect(signedPutSpy).toHaveBeenCalledTimes(1)
      const signerArgs = signedPutSpy.mock.calls[0]![0]
      // Tags must reach the signer so S3's PutObject persists them; this is
      // the gazette-only deviation from the asset bucket signer.
      expect(signerArgs.Tagging).toContain("scheduledAt=1700000000000")
    })

    it("omits Tagging when no tags supplied", async () => {
      const { site, collection } = await seedToppanWithCollection()
      const signedPutSpy = vi
        .spyOn(s3Lib, "generateSignedPutUrl")
        .mockResolvedValue("https://signed.example/put")

      await caller.getPresignedPutUrl({
        siteId: site.id,
        resourceId: collection.id,
        year: 2026,
        category: "Government Gazette",
        subcategory: "Public",
        fileName: "notice-2.pdf",
        fileSize: 1234,
      })

      const signerArgs = signedPutSpy.mock.calls[0]![0]
      expect(signerArgs.Tagging).toBeUndefined()
    })
  })

  describe("getPresignedGetUrl", () => {
    it("returns the signed URL for the gazette bucket", async () => {
      const { site } = await seedToppanWithCollection()
      const signedGetSpy = vi
        .spyOn(s3Lib, "generateSignedGetUrl")
        .mockResolvedValue("https://signed.example/get")

      const result = await caller.getPresignedGetUrl({
        siteId: site.id,
        fileKey: "2026/Government Gazette/Public/notice-1.pdf",
      })

      expect(result.presignedGetUrl).toBe("https://signed.example/get")
      expect(signedGetSpy).toHaveBeenCalledTimes(1)
      const args = signedGetSpy.mock.calls[0]![0]
      expect(args.Key).toBe("2026/Government Gazette/Public/notice-1.pdf")
    })

    it("rejects a fileKey starting with a leading slash (path traversal guard)", async () => {
      const { site } = await seedToppanWithCollection()

      await expect(
        caller.getPresignedGetUrl({
          siteId: site.id,
          fileKey: "/2026/Government Gazette/Public/notice-1.pdf",
        }),
      ).rejects.toThrow()
    })

    it("rejects a fileKey containing a `..` segment", async () => {
      const { site } = await seedToppanWithCollection()

      await expect(
        caller.getPresignedGetUrl({
          siteId: site.id,
          fileKey: "2026/../etc/passwd",
        }),
      ).rejects.toThrow()
    })
  })

  describe("delete", () => {
    /**
     * Helper to seed a published gazette with a Version that has a publishedAt timestamp.
     */
    const seedPublishedGazette = async ({
      siteId,
      collectionId,
      publishedAt,
      userId,
    }: {
      siteId: number
      collectionId: string
      publishedAt: Date
      userId: string
    }) => {
      const { collectionLink, blob } = await setupCollectionLink({
        siteId,
        collectionId,
        permalink: `gazette-${crypto.randomUUID()}`,
      })

      // Set the blob content to include a ref (S3 key)
      await db
        .updateTable("Blob")
        .set({
          content: {
            page: {
              ref: "/test-bucket/gazette.pdf",
              category: "Government Gazette",
              tagged: ["sub-1"],
            },
          } as never,
        })
        .where("id", "=", blob.id)
        .execute()

      // Create a Version with publishedAt
      const version = await db
        .insertInto("Version")
        .values({
          versionNum: 1,
          resourceId: collectionLink.id,
          blobId: blob.id,
          publishedBy: userId,
          publishedAt,
        })
        .returningAll()
        .executeTakeFirstOrThrow()

      // Link the resource to the published version
      await db
        .updateTable("Resource")
        .set({ publishedVersionId: version.id })
        .where("id", "=", collectionLink.id)
        .execute()

      return { gazetteId: Number(collectionLink.id), version, blob }
    }

    beforeEach(() => {
      vi.restoreAllMocks()
      // Mock external services.
      // The flag ENABLE_SEARCHSG_GAZETTE_INGESTION is OFF by default in tests
      // (not in mockFeatureFlags), so the Algolia path is exercised here.
      // SearchSG is mocked too so tests that enable the flag don't hit the network.
      vi.spyOn(gazetteService, "removeGazetteFromAlgolia").mockResolvedValue(
        undefined,
      )
      vi.spyOn(
        gazetteService,
        "removeGazetteFromSearchIndex",
      ).mockResolvedValue(undefined)
      vi.spyOn(gazetteService, "deleteGazetteAsset").mockResolvedValue(
        undefined,
      )
      vi.spyOn(mailService, "sendGazetteDeletionEmail").mockResolvedValue(
        undefined,
      )
    })

    afterEach(() => {
      // Restore the GrowthBook forced features to the baseline so flag state
      // set by individual tests (e.g. the ENABLE_SEARCHSG_GAZETTE_INGESTION ON
      // test) does not leak into subsequent tests. Restoring to mockFeatureFlags
      // (rather than an empty Map) preserves IS_SINGPASS_ENABLED and any other
      // baseline flags that other tests may depend on.
      mockGrowthBook.setForcedFeatures(mockFeatureFlags)
    })

    it("deletes a gazette within the 15-minute grace period", async () => {
      const { site, collection, user } = await seedToppanWithCollection()
      const publishedAt = subMinutes(FIXED_NOW, 10) // 10 minutes ago

      const { gazetteId } = await seedPublishedGazette({
        siteId: site.id,
        collectionId: collection.id,
        publishedAt,
        userId: user.id,
      })

      await caller.delete({
        siteId: site.id,
        gazetteId,
      })

      // Resource should be deleted
      const resource = await db
        .selectFrom("Resource")
        .where("id", "=", String(gazetteId))
        .selectAll()
        .executeTakeFirst()
      expect(resource).toBeUndefined()

      // Audit log should be created
      const auditLogs = await db
        .selectFrom("AuditLog")
        .where("eventType", "=", AuditLogEvent.ResourceDelete)
        .selectAll()
        .execute()
      expect(auditLogs).toHaveLength(1)

      // External services should be called.
      // Flag is OFF (default) so the Algolia path runs.
      expect(gazetteService.removeGazetteFromAlgolia).toHaveBeenCalledTimes(1)
      expect(gazetteService.deleteGazetteAsset).toHaveBeenCalledTimes(1)
    })

    it("deletes a gazette published exactly 15 minutes ago", async () => {
      const { site, collection, user } = await seedToppanWithCollection()
      const publishedAt = subMinutes(FIXED_NOW, 15) // exactly 15 minutes ago

      const { gazetteId } = await seedPublishedGazette({
        siteId: site.id,
        collectionId: collection.id,
        publishedAt,
        userId: user.id,
      })

      await caller.delete({
        siteId: site.id,
        gazetteId,
      })

      // Resource should be deleted
      const resource = await db
        .selectFrom("Resource")
        .where("id", "=", String(gazetteId))
        .selectAll()
        .executeTakeFirst()
      expect(resource).toBeUndefined()
    })

    it("rejects deletion after the 15-minute grace period", async () => {
      const { site, collection, user } = await seedToppanWithCollection()
      const publishedAt = subMinutes(FIXED_NOW, 16) // 16 minutes ago

      const { gazetteId } = await seedPublishedGazette({
        siteId: site.id,
        collectionId: collection.id,
        publishedAt,
        userId: user.id,
      })

      await expect(
        caller.delete({
          siteId: site.id,
          gazetteId,
        }),
      ).rejects.toThrowError(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "Gazettes are unable to be deleted after the given grace period of 15 minutes",
        }),
      )

      // Resource should still exist
      const resource = await db
        .selectFrom("Resource")
        .where("id", "=", String(gazetteId))
        .selectAll()
        .executeTakeFirst()
      expect(resource).toBeDefined()

      // External services should not be called
      expect(gazetteService.removeGazetteFromAlgolia).not.toHaveBeenCalled()
      expect(gazetteService.removeGazetteFromSearchIndex).not.toHaveBeenCalled()
      expect(gazetteService.deleteGazetteAsset).not.toHaveBeenCalled()
    })

    it("rejects deletion for non-Toppan, non-admin users", async () => {
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

      const { gazetteId } = await seedPublishedGazette({
        siteId: site.id,
        collectionId: collection.id,
        publishedAt: subMinutes(FIXED_NOW, 5),
        userId: user.id,
      })

      await expect(
        caller.delete({
          siteId: site.id,
          gazetteId,
        }),
      ).rejects.toThrowError(
        new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to the gazette feature",
        }),
      )
    })

    it("returns NOT_FOUND when gazette does not exist", async () => {
      const { site } = await seedToppanWithCollection()

      await expect(
        caller.delete({
          siteId: site.id,
          gazetteId: 999999,
        }),
      ).rejects.toThrowError(
        new TRPCError({
          code: "NOT_FOUND",
          message: "Resource not found",
        }),
      )
    })

    it("returns NOT_FOUND when gazette exists but has no published version", async () => {
      const { site, collection } = await seedToppanWithCollection()

      // Create a gazette without a published version
      const { collectionLink } = await setupCollectionLink({
        siteId: site.id,
        collectionId: collection.id,
        permalink: `gazette-${crypto.randomUUID()}`,
      })

      await expect(
        caller.delete({
          siteId: site.id,
          gazetteId: Number(collectionLink.id),
        }),
      ).rejects.toThrowError(
        new TRPCError({
          code: "NOT_FOUND",
          message: "The gazette you are trying to delete could not be found",
        }),
      )
    })

    it("allows IsomerAdmin Core user to delete gazette", async () => {
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

      const { gazetteId } = await seedPublishedGazette({
        siteId: site.id,
        collectionId: collection.id,
        publishedAt: subMinutes(FIXED_NOW, 5),
        userId: user.id,
      })

      await caller.delete({
        siteId: site.id,
        gazetteId,
      })

      // Resource should be deleted
      const resource = await db
        .selectFrom("Resource")
        .where("id", "=", String(gazetteId))
        .selectAll()
        .executeTakeFirst()
      expect(resource).toBeUndefined()
    })

    // Exercises the FK constraint path: PushDocumentJob.resource has
    // `onDelete: Restrict`, so deleting the Resource fails if a job row
    // still exists. The cron runs every minute, so in production this is
    // the common case during the grace window — not the exception.
    it("deletes a gazette that still has an unprocessed PushDocumentJob", async () => {
      const { site, collection, user } = await seedToppanWithCollection()
      const publishedAt = subMinutes(FIXED_NOW, 5)

      const { gazetteId } = await seedPublishedGazette({
        siteId: site.id,
        collectionId: collection.id,
        publishedAt,
        userId: user.id,
      })

      await db
        .insertInto("PushDocumentJob")
        .values({
          resourceId: String(gazetteId),
          scheduledAt: FIXED_NOW,
          scheduledBy: user.id,
        })
        .execute()

      await caller.delete({
        siteId: site.id,
        gazetteId,
      })

      const resource = await db
        .selectFrom("Resource")
        .where("id", "=", String(gazetteId))
        .selectAll()
        .executeTakeFirst()
      expect(resource).toBeUndefined()

      const pushJobs = await db
        .selectFrom("PushDocumentJob")
        .where("resourceId", "=", String(gazetteId))
        .selectAll()
        .execute()
      expect(pushJobs).toHaveLength(0)
    })

    it("sends a single deletion email to Datadog with all site admins cc'd", async () => {
      // Arrange
      const { site, collection, user } = await seedToppanWithCollection()
      const otherAdmin = await setupUser({ email: "admin2@agency.gov.sg" })
      await setupAdminPermissions({ userId: otherAdmin.id, siteId: site.id })
      const { gazetteId } = await seedPublishedGazette({
        siteId: site.id,
        collectionId: collection.id,
        publishedAt: subMinutes(FIXED_NOW, 5),
        userId: user.id,
      })

      // Act
      await caller.delete({ siteId: site.id, gazetteId })

      // Assert
      expect(mailService.sendGazetteDeletionEmail).toHaveBeenCalledTimes(1)
      const call = vi.mocked(mailService.sendGazetteDeletionEmail).mock
        .calls[0]?.[0]
      expect(call?.recipientEmail).toBe(env.DD_DELETION_EMAIL)
      // The admins query has no ORDER BY, so compare cc as a sorted set
      expect([...(call?.cc ?? [])].sort()).toEqual(
        ["admin2@agency.gov.sg", "user@toppannext.com"].sort(),
      )
    })

    it("excludes Isomer admins from the deletion email", async () => {
      // Arrange
      const { site, collection, user } = await seedToppanWithCollection()
      const isomerAdminUser = await setupUser({ email: "core@open.gov.sg" })
      await setupAdminPermissions({
        userId: isomerAdminUser.id,
        siteId: site.id,
      })
      await setupIsomerAdmin({ userId: isomerAdminUser.id })
      const { gazetteId } = await seedPublishedGazette({
        siteId: site.id,
        collectionId: collection.id,
        publishedAt: subMinutes(FIXED_NOW, 5),
        userId: user.id,
      })

      // Act
      await caller.delete({ siteId: site.id, gazetteId })

      // Assert
      expect(mailService.sendGazetteDeletionEmail).toHaveBeenCalledTimes(1)
      const call = vi.mocked(mailService.sendGazetteDeletionEmail).mock
        .calls[0]?.[0]
      expect(call?.recipientEmail).toBe(env.DD_DELETION_EMAIL)
      expect(call?.cc).toEqual(["user@toppannext.com"])
    })

    it("calls removeGazetteFromSearchIndex and NOT removeGazetteFromAlgolia when ENABLE_SEARCHSG_GAZETTE_INGESTION is ON", async () => {
      // Arrange
      const { site, collection, user } = await seedToppanWithCollection()
      const { gazetteId } = await seedPublishedGazette({
        siteId: site.id,
        collectionId: collection.id,
        publishedAt: subMinutes(FIXED_NOW, 5),
        userId: user.id,
      })

      // Enable the SearchSG flag for this test only.
      // The afterEach in this describe block restores mockFeatureFlags baseline.
      mockGrowthBook.setForcedFeatures(
        new Map([[ENABLE_SEARCHSG_GAZETTE_INGESTION, true]]),
      )

      // Act
      await caller.delete({ siteId: site.id, gazetteId })

      // Assert — SearchSG path was taken, Algolia path was not.
      expect(gazetteService.removeGazetteFromSearchIndex).toHaveBeenCalledTimes(
        1,
      )
      expect(gazetteService.removeGazetteFromAlgolia).not.toHaveBeenCalled()
      expect(gazetteService.deleteGazetteAsset).toHaveBeenCalledTimes(1)
    })
  })
})
