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
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { copyFile, deleteFile, getFileSize } from "~/lib/s3"
import { createCallerFactory } from "~/server/trpc"
import { IsomerAdminRole, ResourceType } from "~prisma/generated/generatedEnums"

import { db } from "../../database"
import { gazetteRouter } from "../gazette.router"

vi.mock("~/lib/s3", () => ({
  copyFile: vi.fn().mockResolvedValue(undefined),
  deleteFile: vi.fn().mockResolvedValue(undefined),
  getFileSize: vi.fn().mockResolvedValue(1234),
}))

const createCaller = createCallerFactory(gazetteRouter)
const GAZETTE_FILE_SCOPE_ERROR_MESSAGE =
  "The gazette file does not belong to the specified site. You may only use assets for the site you are authorized for."

const gazetteRef = ({
  fileName,
  siteId,
  uuid = crypto.randomUUID(),
}: {
  fileName: string
  siteId: number
  uuid?: string
}) => `/${siteId}/${uuid}/${fileName}`

const foreignGazetteBlobContent = ({
  fileName,
  siteId,
}: {
  fileName: string
  siteId: number
}) =>
  ({
    page: {
      ref: gazetteRef({ siteId, fileName }),
      category: "Government Gazette",
      date: "30/04/2026",
      tagged: ["sub-1"],
    },
  }) as PrismaJson.BlobJsonContent

describe("gazette.router", async () => {
  let caller: ReturnType<typeof createCaller>
  const session = await applyAuthedSession()

  // Frozen "now" so past/future timestamps are deterministic.
  const FIXED_NOW = new Date("2026-04-30T12:00:00.000Z")
  const PAST_DATE = subDays(FIXED_NOW, 1)

  beforeEach(async () => {
    MockDate.set(FIXED_NOW)
    vi.clearAllMocks()
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
        ref: gazetteRef({ siteId: site.id, fileName: "notice-123.pdf" }),
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
      expect(page?.ref).toMatch(
        new RegExp(`^/${site.id}/[^/]+/notice-123\\.pdf$`),
      )

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
          ref: gazetteRef({ siteId: site.id, fileName: "notice.pdf" }),
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
        ref: gazetteRef({
          siteId: site.id,
          fileName: "duplicate-file.pdf",
        }),
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
          ref: gazetteRef({
            siteId: site.id,
            fileName: "duplicate-file.pdf",
          }), // Same filename
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

    it("rejects a ref that belongs to another site before creating a gazette", async () => {
      // Arrange
      const { site, collection } = await seedToppanWithCollection()
      const otherSiteRef = gazetteRef({
        siteId: site.id + 1,
        fileName: "foreign-file.pdf",
      })

      // Act & Assert
      await expect(
        caller.create({
          siteId: site.id,
          collectionId: Number(collection.id),
          title: "Foreign Notice",
          permalink: crypto.randomUUID(),
          ref: otherSiteRef,
          category: "Government Gazette",
          date: "30/04/2026",
          tagged: ["sub-1"],
          scheduledAt: PAST_DATE,
        }),
      ).rejects.toThrowError(
        new TRPCError({
          code: "FORBIDDEN",
          message: GAZETTE_FILE_SCOPE_ERROR_MESSAGE,
        }),
      )

      const gazettes = await db
        .selectFrom("Resource")
        .where("Resource.type", "=", ResourceType.CollectionLink)
        .selectAll()
        .execute()
      expect(gazettes).toHaveLength(0)
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
        ref: gazetteRef({ siteId: site.id, fileName: "notice.pdf" }),
        category: "Government Gazette",
        date: "30/04/2026",
        description: "old-desc",
        tagged: ["sub-1"],
        scheduledAt: PAST_DATE,
      })

      // Act
      await caller.update({
        siteId: site.id,
        gazetteId: Number(gazetteId),
        title: "Renamed",
        newRef: gazetteRef({ siteId: site.id, fileName: "replacement.pdf" }),
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
      expect(page?.ref).toMatch(
        new RegExp(`^/${site.id}/[^/]+/replacement\\.pdf$`),
      )
      expect(page?.category).toBe("Other Supplements")
      expect(page?.description).toBe("new-desc")
      expect(page?.tagged).toEqual(["sub-2"])
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
        ref: gazetteRef({
          siteId: site.id,
          fileName: "existing-file.pdf",
        }),
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
        ref: gazetteRef({
          siteId: site.id,
          fileName: "different-file.pdf",
        }),
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
          newRef: gazetteRef({
            siteId: site.id,
            fileName: "existing-file.pdf",
          }), // Same filename as first
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

    it("rejects a newRef that belongs to another site and does not delete the existing file", async () => {
      // Arrange
      const { site, collection } = await seedToppanWithCollection()
      const { gazetteId } = await caller.create({
        siteId: site.id,
        collectionId: Number(collection.id),
        title: "Original",
        permalink: crypto.randomUUID(),
        ref: gazetteRef({ siteId: site.id, fileName: "notice.pdf" }),
        category: "Government Gazette",
        date: "30/04/2026",
        tagged: ["sub-1"],
        scheduledAt: PAST_DATE,
      })

      // Act & Assert
      await expect(
        caller.update({
          siteId: site.id,
          gazetteId: Number(gazetteId),
          title: "Original",
          newRef: gazetteRef({
            siteId: site.id + 1,
            fileName: "foreign-replacement.pdf",
          }),
          category: "Government Gazette",
          date: "30/04/2026",
          tagged: ["sub-1"],
          scheduledAt: PAST_DATE,
        }),
      ).rejects.toThrowError(
        new TRPCError({
          code: "FORBIDDEN",
          message: GAZETTE_FILE_SCOPE_ERROR_MESSAGE,
        }),
      )
      expect(deleteFile).not.toHaveBeenCalled()
    })

    it("rejects renaming a gazette whose stored ref belongs to another site", async () => {
      // Arrange
      const { site, collection } = await seedToppanWithCollection()
      const { collectionLink, blob } = await setupCollectionLink({
        siteId: site.id,
        collectionId: collection.id,
        title: "Foreign stored ref",
      })
      await db
        .updateTable("Blob")
        .where("id", "=", blob.id)
        .set({
          content: foreignGazetteBlobContent({
            siteId: site.id + 1,
            fileName: "foreign-source.pdf",
          }),
        })
        .execute()

      // Act & Assert
      await expect(
        caller.update({
          siteId: site.id,
          gazetteId: Number(collectionLink.id),
          title: "Foreign stored ref",
          desiredFileName: "renamed.pdf",
          category: "Government Gazette",
          date: "30/04/2026",
          tagged: ["sub-1"],
          scheduledAt: PAST_DATE,
        }),
      ).rejects.toThrowError(
        new TRPCError({
          code: "FORBIDDEN",
          message: GAZETTE_FILE_SCOPE_ERROR_MESSAGE,
        }),
      )
      expect(copyFile).not.toHaveBeenCalled()
      expect(deleteFile).not.toHaveBeenCalled()
    })
  })

  describe("list", () => {
    it("does not look up S3 metadata for a stored ref outside the requested site", async () => {
      // Arrange
      const { site, collection } = await seedToppanWithCollection()
      const { blob } = await setupCollectionLink({
        siteId: site.id,
        collectionId: collection.id,
        title: "Foreign stored ref",
      })
      await db
        .updateTable("Blob")
        .where("id", "=", blob.id)
        .set({
          content: foreignGazetteBlobContent({
            siteId: site.id + 1,
            fileName: "foreign-source.pdf",
          }),
        })
        .execute()

      // Act
      const result = await caller.list({
        siteId: site.id,
        collectionId: Number(collection.id),
        limit: 10,
        offset: 0,
      })

      // Assert
      expect(result).toHaveLength(1)
      expect(result[0]?.fileSize).toBeNull()
      expect(getFileSize).not.toHaveBeenCalled()
    })
  })
})
