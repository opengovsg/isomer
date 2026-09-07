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
import * as algoliaLib from "~/lib/algolia"
import { ENABLE_SEARCHSG_GAZETTE_INGESTION } from "~/lib/growthbook"
import * as s3Lib from "~/lib/s3"
import { createCallerFactory } from "~/server/trpc"
import {
  AuditLogEvent,
  IsomerAdminRole,
  ResourceType,
} from "~prisma/generated/generatedEnums"

import { db } from "../../database/database"
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
    vi.spyOn(algoliaLib, "saveObjectsToSearchIndex").mockResolvedValue()
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
      email: "user@toppannext.com",
      userId: session.userId ?? undefined,
    })
    await auth(user)
    const { site, collection } = await setupCollection({})
    await setupAdminPermissions({
      siteId: site.id,
      userId: session.userId ?? undefined,
    })
    return { collection, site, user }
  }

  describe("assertGazetteAccess (via gazette.list)", () => {
    it("rejects an ordinary site member with no Toppan email and no admin role", async () => {
      // Arrange
      const user = await setupUser({
        email: "user@example.com",
        userId: session.userId ?? undefined,
      })
      await auth(user)
      const { site, collection } = await setupCollection({})
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId ?? undefined,
      })

      // Act & Assert
      await expect(
        caller.list({
          collectionId: Number(collection.id),
          limit: 10,
          offset: 0,
          siteId: site.id,
        }),
      ).rejects.toThrow(
        new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to the gazette feature",
        }),
      )
    })

    it("allows an IsomerAdmin Core user even without a Toppan email", async () => {
      // Arrange
      const user = await setupUser({
        email: "admin@example.com",
        userId: session.userId ?? undefined,
      })
      await auth(user)
      await setupIsomerAdmin({ role: IsomerAdminRole.Core, userId: user.id })
      const { site, collection } = await setupCollection({})
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId ?? undefined,
      })

      // Act
      const result = await caller.list({
        collectionId: Number(collection.id),
        limit: 10,
        offset: 0,
        siteId: site.id,
      })

      // Assert
      expect(result).toEqual([])
    })

    it("allows a Toppan-email user", async () => {
      // Arrange
      const { site, collection } = await seedToppanWithCollection()

      // Act
      const result = await caller.list({
        collectionId: Number(collection.id),
        limit: 10,
        offset: 0,
        siteId: site.id,
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
          collectionId: 1,
          limit: 10,
          offset: 0,
          siteId: 1,
        }),
      ).rejects.toThrow(new TRPCError({ code: "UNAUTHORIZED" }))
    })
  })

  describe("create", () => {
    it("creates a gazette resource + blob + audit entries in one transaction", async () => {
      // Arrange
      const { site, collection, user } = await seedToppanWithCollection()

      // Act
      const { gazetteId } = await caller.create({
        category: "Government Gazette",
        collectionId: Number(collection.id),
        date: "30/04/2026",
        description: "Notif #123",
        permalink: crypto.randomUUID(),
        ref: "/1/abc/notice-123.pdf",
        scheduledAt: PAST_DATE,
        siteId: site.id,
        tagged: ["sub-1"],
        title: "Notice 123",
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
      // SAFETY: blob content is narrowed to the link page ref field under test.
      const page = (blob.content as { page?: { ref?: string } } | null)?.page
      expect(page?.ref).toBe("/1/abc/notice-123.pdf")

      // Both audit entries (resource create + schedule publish) emitted.
      const auditLogs = await db.selectFrom("AuditLog").selectAll().execute()
      expect(auditLogs).toHaveLength(2)
    })

    it("rejects a non-Toppan, non-admin caller before any DB writes", async () => {
      // Arrange
      const user = await setupUser({
        email: "user@example.com",
        userId: session.userId ?? undefined,
      })
      await auth(user)
      const { site, collection } = await setupCollection({})
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId ?? undefined,
      })

      // Act & Assert
      await expect(
        caller.create({
          category: "Government Gazette",
          collectionId: Number(collection.id),
          date: "30/04/2026",
          permalink: crypto.randomUUID(),
          ref: "/1/abc/notice.pdf",
          scheduledAt: PAST_DATE,
          siteId: site.id,
          tagged: ["sub-1"],
          title: "Notice 123",
        }),
      ).rejects.toThrow(
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
        category: "Government Gazette",
        collectionId: Number(collection.id),
        date: "30/04/2026",
        permalink: crypto.randomUUID(),
        ref: "/sites/1/gazettes/uuid1/duplicate-file.pdf",
        scheduledAt: PAST_DATE,
        siteId: site.id,
        tagged: ["sub-1"],
        title: "First Notice",
      })

      // Act & Assert: creating a second gazette with the same filename is rejected
      await expect(
        caller.create({
          category: "Government Gazette",
          collectionId: Number(collection.id),
          date: "30/04/2026",
          permalink: crypto.randomUUID(),
          ref: "/sites/1/gazettes/uuid2/duplicate-file.pdf",
          // Same filename
          scheduledAt: PAST_DATE,
          siteId: site.id,
          tagged: ["sub-1"],
          title: "Second Notice",
        }),
      ).rejects.toThrow(
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
        category: "Government Gazette",
        collectionId: Number(collection.id),
        date: "30/04/2026",
        description: "N-2026-001",
        permalink: crypto.randomUUID(),
        ref: "/sites/1/gazettes/uuid1/first-file.pdf",
        scheduledAt: PAST_DATE,
        siteId: site.id,
        tagged: ["sub-1"],
        title: "First Notice",
      })

      // Act & Assert: creating a second gazette with the same notification number is rejected
      await expect(
        caller.create({
          category: "Government Gazette",
          collectionId: Number(collection.id),
          date: "30/04/2026",
          description: "N-2026-001",
          // Same notification number
          permalink: crypto.randomUUID(),
          ref: "/sites/1/gazettes/uuid2/second-file.pdf",
          // Different filename
          scheduledAt: PAST_DATE,
          siteId: site.id,
          tagged: ["sub-1"],
          title: "Second Notice",
        }),
      ).rejects.toThrow(
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
        category: "Legislative Supplements",
        collectionId: Number(collection.id),
        date: "30/04/2026",
        description: "N-2026-001",
        permalink: crypto.randomUUID(),
        ref: "/sites/1/gazettes/uuid1/first-file.pdf",
        scheduledAt: PAST_DATE,
        siteId: site.id,
        tagged: ["Acts Supplement"],
        title: "First Supplement",
      })

      // Act & Assert: same notification number + same year + same subcategory is a duplicate
      await expect(
        caller.create({
          category: "Legislative Supplements",
          collectionId: Number(collection.id),
          date: "30/04/2026",
          description: "N-2026-001",
          // Same notification number
          permalink: crypto.randomUUID(),
          ref: "/sites/1/gazettes/uuid2/second-file.pdf",
          // Different filename
          scheduledAt: PAST_DATE,
          siteId: site.id,
          tagged: ["Acts Supplement"],
          // Same subcategory
          title: "Second Supplement",
        }),
      ).rejects.toThrow(
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
        category: "Legislative Supplements",
        collectionId: Number(collection.id),
        date: "30/04/2026",
        description: "N-2026-001",
        permalink: crypto.randomUUID(),
        ref: "/sites/1/gazettes/uuid1/first-file.pdf",
        scheduledAt: PAST_DATE,
        siteId: site.id,
        tagged: ["Acts Supplement"],
        title: "First Supplement",
      })

      // Act: same notification number + same year but a different subcategory.
      // For non-Government Gazette categories the subcategory disambiguates, so
      // this is not a duplicate and must be allowed.
      const { gazetteId } = await caller.create({
        category: "Legislative Supplements",
        collectionId: Number(collection.id),
        date: "30/04/2026",
        description: "N-2026-001",
        // Same notification number
        permalink: crypto.randomUUID(),
        ref: "/sites/1/gazettes/uuid2/second-file.pdf",
        scheduledAt: PAST_DATE,
        siteId: site.id,
        tagged: ["Bills Supplement"],
        // Different subcategory
        title: "Second Supplement",
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
        category: "Government Gazette",
        collectionId: Number(collection.id),
        date: "30/04/2026",
        description: "old-desc",
        permalink: crypto.randomUUID(),
        ref: "/1/abc/notice.pdf",
        scheduledAt: PAST_DATE,
        siteId: site.id,
        tagged: ["sub-1"],
        title: "Original",
      })

      const markFileAsDeleted = vi
        .spyOn(gazetteService, "markFileAsDeleted")
        .mockResolvedValue()

      // Act
      await caller.update({
        category: "Other Supplements",
        date: "30/04/2026",
        description: "new-desc",
        gazetteId: Number(gazetteId),
        newRef: "/1/abc/replacement.pdf",
        scheduledAt: PAST_DATE,
        siteId: site.id,
        tagged: ["sub-2"],
        title: "Renamed",
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
      // SAFETY: blob content is narrowed to link page fields asserted below.
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
        category: "Government Gazette",
        collectionId: Number(collection.id),
        date: "30/04/2026",
        permalink: crypto.randomUUID(),
        ref: "/2026/Government Gazette/sub-1/notice.pdf",
        scheduledAt: PAST_DATE,
        siteId: site.id,
        tagged: ["sub-1"],
        title: "Original",
      })
      const markFileAsDeleted = vi
        .spyOn(gazetteService, "markFileAsDeleted")
        .mockResolvedValue()

      // Act: re-upload to the same key
      await caller.update({
        category: "Government Gazette",
        date: "30/04/2026",
        gazetteId: Number(gazetteId),
        newRef: "/2026/Government Gazette/sub-1/notice.pdf",
        scheduledAt: PAST_DATE,
        siteId: site.id,
        tagged: ["sub-1"],
        title: "Original",
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
      // SAFETY: blob content is narrowed to the link page ref field under test.
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
        collectionId: collection.id,
        permalink: "egazette-link",
        siteId: site.id,
      })
      // Set a future schedule on it so the update test moves it backwards.
      await db
        .updateTable("Resource")
        .where("id", "=", collectionLink.id)
        .set({ scheduledAt: futureScheduledAt })
        .execute()

      // Act
      await caller.update({
        category: "Government Gazette",
        date: "30/04/2026",
        gazetteId: Number(collectionLink.id),
        scheduledAt: PAST_DATE,
        siteId: site.id,
        tagged: ["sub-1"],
        title: "ImmediatePublish",
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
        category: "Government Gazette",
        collectionId: Number(collection.id),
        date: "30/04/2026",
        permalink: crypto.randomUUID(),
        ref: "/sites/1/gazettes/uuid1/existing-file.pdf",
        scheduledAt: PAST_DATE,
        siteId: site.id,
        tagged: ["sub-1"],
        title: "First Notice",
      })

      // Create second gazette with a different filename
      const { gazetteId } = await caller.create({
        category: "Government Gazette",
        collectionId: Number(collection.id),
        date: "30/04/2026",
        permalink: crypto.randomUUID(),
        ref: "/sites/1/gazettes/uuid2/different-file.pdf",
        scheduledAt: PAST_DATE,
        siteId: site.id,
        tagged: ["sub-1"],
        title: "Second Notice",
      })

      // Act & Assert: updating to a filename already used by another gazette is rejected
      await expect(
        caller.update({
          category: "Government Gazette",
          date: "30/04/2026",
          gazetteId: Number(gazetteId),
          newRef: "/sites/1/gazettes/uuid3/existing-file.pdf",
          // Same filename as first
          scheduledAt: PAST_DATE,
          siteId: site.id,
          tagged: ["sub-1"],
          title: "Second Notice",
        }),
      ).rejects.toThrow(
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
        category: "Government Gazette",
        collectionId: Number(collection.id),
        date: "30/04/2026",
        description: "N-2026-001",
        permalink: crypto.randomUUID(),
        ref: "/sites/1/gazettes/uuid1/first-file.pdf",
        scheduledAt: PAST_DATE,
        siteId: site.id,
        tagged: ["sub-1"],
        title: "First Notice",
      })

      // Create second gazette with a different notification number
      const { gazetteId } = await caller.create({
        category: "Government Gazette",
        collectionId: Number(collection.id),
        date: "30/04/2026",
        description: "N-2026-002",
        permalink: crypto.randomUUID(),
        ref: "/sites/1/gazettes/uuid2/second-file.pdf",
        scheduledAt: PAST_DATE,
        siteId: site.id,
        tagged: ["sub-1"],
        title: "Second Notice",
      })

      // Act & Assert: updating to a notification number used by another gazette is rejected
      await expect(
        caller.update({
          category: "Government Gazette",
          date: "30/04/2026",
          description: "N-2026-001",
          // Same notification number as first
          gazetteId: Number(gazetteId),
          scheduledAt: PAST_DATE,
          siteId: site.id,
          tagged: ["sub-1"],
          title: "Second Notice",
        }),
      ).rejects.toThrow(
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
        category: "Government Gazette",
        collectionId: Number(collection.id),
        date: "30/04/2026",
        description: "N-2026-001",
        permalink: crypto.randomUUID(),
        ref: "/sites/1/gazettes/uuid1/file.pdf",
        scheduledAt: PAST_DATE,
        siteId: site.id,
        tagged: ["sub-1"],
        title: "Original",
      })

      // Act: editing other fields while retaining the same notification number
      // must not trip the duplicate check against the gazette's own record.
      await caller.update({
        category: "Government Gazette",
        date: "30/04/2026",
        description: "N-2026-001",
        // Unchanged
        gazetteId: Number(gazetteId),
        scheduledAt: PAST_DATE,
        siteId: site.id,
        tagged: ["sub-1"],
        title: "Renamed",
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
      // SAFETY: s3 tagging response fields are unused by the delete flow under test.
      const markCancelled = vi
        .spyOn(s3Lib, "markScheduledAssetAsCancelled")
        .mockResolvedValue(
          {} as Awaited<ReturnType<typeof s3Lib.markScheduledAssetAsCancelled>>,
        )

      const { gazetteId } = await caller.create({
        category: "Government Gazette",
        collectionId: Number(collection.id),
        date: "30/04/2026",
        permalink: crypto.randomUUID(),
        ref: "/1/abc/about-to-cancel.pdf",
        scheduledAt: PAST_DATE,
        siteId: site.id,
        tagged: ["sub-1"],
        title: "About to cancel",
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
        gazetteId: Number(gazetteId),
        siteId: site.id,
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
      // SAFETY: audit log delta shape is narrowed to cancel-schedule fields under test.
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
        collectionId: collection.id,
        permalink: "not-scheduled",
        siteId: site.id,
      })

      await expect(
        caller.cancelScheduledPublish({
          gazetteId: Number(collectionLink.id),
          siteId: site.id,
        }),
      ).rejects.toThrow(
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
        category: "Government Gazette",
        collectionId: Number(collection.id),
        date: "30/04/2026",
        permalink: crypto.randomUUID(),
        ref: "/1/abc/s3-fail.pdf",
        scheduledAt: PAST_DATE,
        siteId: site.id,
        tagged: ["sub-1"],
        title: "S3 will fail",
      })

      // Should NOT throw — DB tx commits first, S3 is best-effort.
      await expect(
        caller.cancelScheduledPublish({
          gazetteId: Number(gazetteId),
          siteId: site.id,
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
        category: "Government Gazette",
        fileName: "notice-1.pdf",
        fileSize: 1234,
        resourceId: collection.id,
        siteId: site.id,
        subcategory: "Public",
        tags: [{ key: "scheduledAt", value: "1700000000000" }],
        year: 2026,
      })

      expect(result.presignedPutUrl).toBe("https://signed.example/put")
      expect(result.fileKey).toMatch(
        /^2026\/Government Gazette\/Public\/notice-1\.pdf$/u,
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
        category: "Government Gazette",
        fileName: "notice-2.pdf",
        fileSize: 1234,
        resourceId: collection.id,
        siteId: site.id,
        subcategory: "Public",
        year: 2026,
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
        fileKey: "2026/Government Gazette/Public/notice-1.pdf",
        siteId: site.id,
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
          fileKey: "/2026/Government Gazette/Public/notice-1.pdf",
          siteId: site.id,
        }),
      ).rejects.toThrow()
    })

    it("rejects a fileKey containing a `..` segment", async () => {
      const { site } = await seedToppanWithCollection()

      await expect(
        caller.getPresignedGetUrl({
          fileKey: "2026/../etc/passwd",
          siteId: site.id,
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
        collectionId,
        permalink: `gazette-${crypto.randomUUID()}`,
        siteId,
      })

      // Set the blob content to include a ref (S3 key)
      await db
        .updateTable("Blob")
        .set({
          // SAFETY: partial link-layout page fixture supplies only fields read by ingestion.
          content: {
            page: {
              category: "Government Gazette",
              ref: "/test-bucket/gazette.pdf",
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
          blobId: blob.id,
          publishedAt,
          publishedBy: userId,
          resourceId: collectionLink.id,
          versionNum: 1,
        })
        .returningAll()
        .executeTakeFirstOrThrow()

      // Link the resource to the published version
      await db
        .updateTable("Resource")
        .set({ publishedVersionId: version.id })
        .where("id", "=", collectionLink.id)
        .execute()

      return { blob, gazetteId: Number(collectionLink.id), version }
    }

    beforeEach(() => {
      vi.restoreAllMocks()
      // Mock external services.
      // The flag ENABLE_SEARCHSG_GAZETTE_INGESTION is OFF by default in tests
      // (not in mockFeatureFlags), so the Algolia path is exercised here.
      // SearchSG is mocked too so tests that enable the flag don't hit the network.
      vi.spyOn(gazetteService, "removeGazetteFromAlgolia").mockResolvedValue()
      vi.spyOn(
        gazetteService,
        "removeGazetteFromSearchIndex",
      ).mockResolvedValue()
      vi.spyOn(gazetteService, "deleteGazetteAsset").mockResolvedValue()
      vi.spyOn(mailService, "sendGazetteDeletionEmail").mockResolvedValue()
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
      const publishedAt = subMinutes(FIXED_NOW, 10)
      // 10 minutes ago

      const { gazetteId } = await seedPublishedGazette({
        collectionId: collection.id,
        publishedAt,
        siteId: site.id,
        userId: user.id,
      })

      await caller.delete({
        gazetteId,
        siteId: site.id,
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
      const publishedAt = subMinutes(FIXED_NOW, 15)
      // exactly 15 minutes ago

      const { gazetteId } = await seedPublishedGazette({
        collectionId: collection.id,
        publishedAt,
        siteId: site.id,
        userId: user.id,
      })

      await caller.delete({
        gazetteId,
        siteId: site.id,
      })

      // Resource should be deleted
      const resource = await db
        .selectFrom("Resource")
        .where("id", "=", String(gazetteId))
        .selectAll()
        .executeTakeFirst()
      expect(resource).toBeUndefined()
    })

    it("rejects deletion after the 30-minute grace period", async () => {
      const { site, collection, user } = await seedToppanWithCollection()
      const publishedAt = subMinutes(FIXED_NOW, 31)
      // 31 minutes ago

      const { gazetteId } = await seedPublishedGazette({
        collectionId: collection.id,
        publishedAt,
        siteId: site.id,
        userId: user.id,
      })

      await expect(
        caller.delete({
          gazetteId,
          siteId: site.id,
        }),
      ).rejects.toThrow(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "Gazettes are unable to be deleted after the given grace period of 30 minutes",
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
        email: "user@example.com",
        userId: session.userId ?? undefined,
      })
      await auth(user)
      const { site, collection } = await setupCollection({})
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId ?? undefined,
      })

      const { gazetteId } = await seedPublishedGazette({
        collectionId: collection.id,
        publishedAt: subMinutes(FIXED_NOW, 5),
        siteId: site.id,
        userId: user.id,
      })

      await expect(
        caller.delete({
          gazetteId,
          siteId: site.id,
        }),
      ).rejects.toThrow(
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
          gazetteId: 999_999,
          siteId: site.id,
        }),
      ).rejects.toThrow(
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
        collectionId: collection.id,
        permalink: `gazette-${crypto.randomUUID()}`,
        siteId: site.id,
      })

      await expect(
        caller.delete({
          gazetteId: Number(collectionLink.id),
          siteId: site.id,
        }),
      ).rejects.toThrow(
        new TRPCError({
          code: "NOT_FOUND",
          message: "The gazette you are trying to delete could not be found",
        }),
      )
    })

    it("allows IsomerAdmin Core user to delete gazette", async () => {
      const user = await setupUser({
        email: "admin@example.com",
        userId: session.userId ?? undefined,
      })
      await auth(user)
      await setupIsomerAdmin({ role: IsomerAdminRole.Core, userId: user.id })
      const { site, collection } = await setupCollection({})
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId ?? undefined,
      })

      const { gazetteId } = await seedPublishedGazette({
        collectionId: collection.id,
        publishedAt: subMinutes(FIXED_NOW, 5),
        siteId: site.id,
        userId: user.id,
      })

      await caller.delete({
        gazetteId,
        siteId: site.id,
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
        collectionId: collection.id,
        publishedAt,
        siteId: site.id,
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
        gazetteId,
        siteId: site.id,
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
      await setupAdminPermissions({ siteId: site.id, userId: otherAdmin.id })
      const { gazetteId } = await seedPublishedGazette({
        collectionId: collection.id,
        publishedAt: subMinutes(FIXED_NOW, 5),
        siteId: site.id,
        userId: user.id,
      })

      // Act
      await caller.delete({ gazetteId, siteId: site.id })

      // Assert
      expect(mailService.sendGazetteDeletionEmail).toHaveBeenCalledTimes(1)
      const call = vi.mocked(mailService.sendGazetteDeletionEmail).mock
        .calls[0]?.[0]
      expect(call?.recipientEmail).toBe(env.DD_DELETION_EMAIL)
      // The admins query has no ORDER BY, so compare cc as a sorted set
      expect([...(call?.cc ?? [])].toSorted()).toEqual(
        ["admin2@agency.gov.sg", "user@toppannext.com"].toSorted(),
      )
    })

    it("excludes Isomer admins from the deletion email", async () => {
      // Arrange
      const { site, collection, user } = await seedToppanWithCollection()
      const isomerAdminUser = await setupUser({ email: "core@open.gov.sg" })
      await setupAdminPermissions({
        siteId: site.id,
        userId: isomerAdminUser.id,
      })
      await setupIsomerAdmin({ userId: isomerAdminUser.id })
      const { gazetteId } = await seedPublishedGazette({
        collectionId: collection.id,
        publishedAt: subMinutes(FIXED_NOW, 5),
        siteId: site.id,
        userId: user.id,
      })

      // Act
      await caller.delete({ gazetteId, siteId: site.id })

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
        collectionId: collection.id,
        publishedAt: subMinutes(FIXED_NOW, 5),
        siteId: site.id,
        userId: user.id,
      })

      // Enable the SearchSG flag for this test only.
      // The afterEach in this describe block restores mockFeatureFlags baseline.
      mockGrowthBook.setForcedFeatures(
        new Map([[ENABLE_SEARCHSG_GAZETTE_INGESTION, true]]),
      )

      // Act
      await caller.delete({ gazetteId, siteId: site.id })

      // Assert — SearchSG path was taken, Algolia path was not.
      expect(gazetteService.removeGazetteFromSearchIndex).toHaveBeenCalledTimes(
        1,
      )
      expect(gazetteService.removeGazetteFromAlgolia).not.toHaveBeenCalled()
      expect(gazetteService.deleteGazetteAsset).toHaveBeenCalledTimes(1)
    })
  })
})
