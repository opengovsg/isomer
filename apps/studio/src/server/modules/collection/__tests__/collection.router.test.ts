import type { MockInstance } from "vitest"
import { TRPCError } from "@trpc/server"
import { omit } from "lodash-es"
import { randomUUID } from "node:crypto"
import { auth } from "tests/integration/helpers/auth"
import { resetTables } from "tests/integration/helpers/db"
import {
  applyAuthedSession,
  applySession,
  createMockRequest,
} from "tests/integration/helpers/iron-session"
import {
  collectionPageBlobContent,
  setupAdminPermissions,
  setupCollection,
  setupCollectionLink,
  setupCollectionPage,
  setupEditorPermissions,
  setupFolder,
  setupPageResource,
  setupSite,
  setupUser,
} from "tests/integration/helpers/seed"
import * as auditService from "~/server/modules/audit/audit.service"
import { createCallerFactory } from "~/server/trpc"

import { assertAuditLogRows } from "../../audit/__tests__/utils"
import { db } from "../../database/database"
import { ResourceState, ResourceType } from "../../database/types"
import { jsonb } from "../../database/utils"
import { getBlobOfResource } from "../../resource/resource.service"
import { collectionRouter } from "../collection.router"
import {
  getCollectionItemByPermalink,
  getCollectionWithPermalink,
} from "./utils"

const createCaller = createCallerFactory(collectionRouter)

describe("collection.router", async () => {
  let caller: ReturnType<typeof createCaller>
  let unauthedCaller: ReturnType<typeof createCaller>
  const session = await applyAuthedSession()
  let auditSpy: MockInstance<
    auditService.AuditLogger<auditService.ResourceEventLogProps>
  >

  beforeEach(async () => {
    await resetTables(
      "Blob",
      "AuditLog",
      "Resource",
      "Site",
      "Version",
      "User",
      "ResourcePermission",
    )
    caller = createCaller(createMockRequest(session))
    const unauthedSession = applySession()
    unauthedCaller = createCaller(createMockRequest(unauthedSession))
    const user = await setupUser({
      email: "test@mock.com",
      isDeleted: false,
      userId: session.userId,
    })
    await auth(user)
    auditSpy = vitest.spyOn(auditService, "logResourceEvent")
    auditSpy.mockClear()
  })

  describe("create", () => {
    it("should throw 401 if not logged in", async () => {
      // Act
      const result = unauthedCaller.create({
        collectionTitle: "test collection",
        permalink: "test-collection",
        siteId: 1,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
      expect(auditSpy).not.toHaveBeenCalled()
      await assertAuditLogRows()
    })

    it("should throw 409 if permalink already exists", async () => {
      // Arrange
      const duplicatePermalink = "duplicate-permalink"
      const { site } = await setupCollection({ permalink: duplicatePermalink })
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = caller.create({
        collectionTitle: "test folder",
        permalink: duplicatePermalink,
        siteId: site.id,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "CONFLICT",
          message: "A resource with the same permalink already exists",
        }),
      )
      expect(auditSpy).not.toHaveBeenCalled()
      await assertAuditLogRows()
    })

    it("should throw 403 if `siteId` does not exist (no access to that site)", async () => {
      // Arrange
      const invalidSiteId = 999
      const { site } = await setupSite()
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId,
      })
      expect(site.id).not.toEqual(invalidSiteId)

      // Act
      const result = caller.create({
        collectionTitle: "test collection",
        permalink: "test-collection",
        siteId: invalidSiteId,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )
      expect(auditSpy).not.toHaveBeenCalled()
      await assertAuditLogRows()
    })

    it("should throw 404 if `parentFolderId` does not exist", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = caller.create({
        collectionTitle: "test collection",
        parentFolderId: 999,
        permalink: "test-collection",
        siteId: site.id,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "NOT_FOUND",
          message: "Parent folder does not exist",
        }),
      )
      expect(auditSpy).not.toHaveBeenCalled()
      await assertAuditLogRows()
    })

    it("should throw 400 if `parentFolderId` is not a folder", async () => {
      // Arrange
      const { site, page } = await setupPageResource({
        resourceType: "Page",
      })
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = caller.create({
        collectionTitle: "test collection",
        parentFolderId: Number(page.id),
        permalink: "test-collection",
        siteId: site.id,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Collections can only be created inside other folders or at the root",
        }),
      )
      expect(auditSpy).not.toHaveBeenCalled()
      await assertAuditLogRows()
    })

    it("should create a collection even with duplicate permalink if `siteId` is different", async () => {
      // Arrange
      const duplicatePermalink = "duplicate-permalink"
      const { site: _firstSite } = await setupCollection({
        permalink: duplicatePermalink,
      })
      const { site: secondSite } = await setupSite()
      await setupAdminPermissions({
        siteId: secondSite.id,
        userId: session.userId,
      })

      // Act
      const result = await caller.create({
        collectionTitle: "test collection",
        permalink: duplicatePermalink,
        siteId: secondSite.id,
      })

      // Assert
      const actualCollection = await getCollectionWithPermalink({
        permalink: duplicatePermalink,
        siteId: secondSite.id,
      })
      expect(result).toMatchObject({ id: actualCollection.id })
      expect(auditSpy).toHaveBeenCalled()
      await assertAuditLogRows(3)
      const auditEntry = await db
        .selectFrom("AuditLog")
        .where("eventType", "=", "ResourceCreate")
        .selectAll()
        .executeTakeFirstOrThrow()
      expect(auditEntry.delta.after!).toMatchObject(result)
      expect(auditEntry.userId).toBe(session.userId)
    })

    it("should create a collection at root when no `parentId` is specified", async () => {
      // Arrange
      const permalinkToUse = "test-collection-999"
      const { site } = await setupSite()

      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = await caller.create({
        collectionTitle: "test collection 999",
        permalink: permalinkToUse,
        siteId: site.id,
      })

      // Assert
      const actualCollection = await getCollectionWithPermalink({
        permalink: permalinkToUse,
        siteId: site.id,
      })
      expect(result).toMatchObject({ id: actualCollection.id })
      expect(auditSpy).toHaveBeenCalled()
      await assertAuditLogRows(3)
      const auditEntry = await db
        .selectFrom("AuditLog")
        .where("eventType", "=", "ResourceCreate")
        .selectAll()
        .executeTakeFirstOrThrow()
      expect(auditEntry.delta.after!).toMatchObject(result)
      expect(auditEntry.userId).toBe(session.userId)
    })

    it("should create a nested collection if `parentFolderId` is provided and the user is an admin", async () => {
      // Arrange
      const permalinkToUse = "test-collection-777"
      const { folder: parent, site } = await setupFolder()
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = await caller.create({
        collectionTitle: "test collection",
        parentFolderId: Number(parent.id),
        permalink: permalinkToUse,
        siteId: site.id,
      })

      // Assert
      const actualCollection = await getCollectionWithPermalink({
        permalink: permalinkToUse,
        siteId: site.id,
      })
      expect(actualCollection.parentId).toEqual(parent.id)
      expect(result).toMatchObject({ id: actualCollection.id })
      await assertAuditLogRows(3)
      expect(auditSpy).toHaveBeenCalled()
      const auditEntry = await db
        .selectFrom("AuditLog")
        .where("eventType", "=", "ResourceCreate")
        .selectAll()
        .executeTakeFirstOrThrow()
      expect(auditEntry.delta.after!).toMatchObject(result)
      expect(auditEntry.userId).toBe(session.userId)
    })

    it("should create a nested collection if `parentFolderId` is provided and the user is not an admin", async () => {
      // Arrange
      const permalinkToUse = "test-collection-777"
      const { folder: parent, site } = await setupFolder()
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = await caller.create({
        collectionTitle: "test collection",
        parentFolderId: Number(parent.id),
        permalink: permalinkToUse,
        siteId: site.id,
      })

      // Assert
      const actualCollection = await getCollectionWithPermalink({
        permalink: permalinkToUse,
        siteId: site.id,
      })
      expect(actualCollection.parentId).toEqual(parent.id)
      expect(result).toMatchObject({ id: actualCollection.id })
      await assertAuditLogRows(3)
      expect(auditSpy).toHaveBeenCalled()
      const auditEntry = await db
        .selectFrom("AuditLog")
        .where("eventType", "=", "ResourceCreate")
        .selectAll()
        .executeTakeFirstOrThrow()
      expect(auditEntry.delta.after!).toMatchObject(result)
      expect(auditEntry.userId).toBe(session.userId)
    })

    it("should throw 403 if user does not have admin access to the site and tries to create a root level folder", async () => {
      // Arrange
      const permalinkToUse = "test-collection-777"
      const { site } = await setupSite()
      await setupEditorPermissions({ siteId: site.id, userId: session.userId })

      // Act
      const result = caller.create({
        collectionTitle: "test collection",
        permalink: permalinkToUse,
        siteId: site.id,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )
      await assertAuditLogRows()
    })

    it("should throw 403 if user does not have access to the site", async () => {
      // Arrange
      const permalinkToUse = "test-collection-777"
      const { folder: parentFolder, site } = await setupFolder()

      // Act
      const result = caller.create({
        collectionTitle: "test collection",
        parentFolderId: Number(parentFolder.id),
        permalink: permalinkToUse,
        siteId: site.id,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )
      await assertAuditLogRows()
    })

    it.skip("should throw 403 if user does not have write access to the parent folder", async () => {})
  })

  describe("createCollectionPage", () => {
    it("should throw 401 if not logged in", async () => {
      // Arrange
      const { collection, site } = await setupCollection()

      // Act
      const result = unauthedCaller.createCollectionPage({
        collectionId: Number(collection.id),
        permalink: "test-collection",
        siteId: site.id,
        title: "test collection",
        type: "CollectionPage",
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
      expect(auditSpy).not.toHaveBeenCalled()
      await assertAuditLogRows()
    })

    it("should throw 409 if permalink already exists", async () => {
      // Arrange
      const duplicatePermalink = "duplicate-permalink"
      const { collection, site } = await setupCollection({
        permalink: "parent",
      })
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId,
      })
      await setupPageResource({
        parentId: collection.id,
        permalink: duplicatePermalink,
        resourceType: "CollectionPage",
        siteId: site.id,
        title: "test folder",
      })

      // Act
      const result = caller.createCollectionPage({
        collectionId: Number(collection.id),
        permalink: duplicatePermalink,
        siteId: site.id,
        title: "test folder",
        type: "CollectionPage",
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "CONFLICT",
          message: "A resource with the same permalink already exists",
        }),
      )
      expect(auditSpy).not.toHaveBeenCalled()
      await assertAuditLogRows()
    })

    it("should throw 403 if `siteId` does not exist (no access to that site)", async () => {
      // Arrange
      const invalidSiteId = 999
      const { collection, site } = await setupCollection()
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId,
      })
      expect(site.id).not.toEqual(invalidSiteId)

      // Act
      const result = caller.createCollectionPage({
        collectionId: Number(collection.id),
        permalink: "test-collection",
        siteId: 999,
        title: "test collection",
        type: "CollectionPage",
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )
      expect(auditSpy).not.toHaveBeenCalled()
      await assertAuditLogRows()
    })

    it("should throw 404 if `collectionId` does not exist", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = caller.createCollectionPage({
        collectionId: 999,
        permalink: "test-collection",
        siteId: site.id,
        title: "test collection",
        type: "CollectionPage",
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "NOT_FOUND",
          message: "Parent collection does not exist",
        }),
      )
      expect(auditSpy).not.toHaveBeenCalled()
      await assertAuditLogRows()
    })

    it("should throw 404 if `collectionId` is not a collection", async () => {
      // Arrange
      const { site, page } = await setupPageResource({
        resourceType: "Page",
      })
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = caller.createCollectionPage({
        collectionId: Number(page.id),
        permalink: "test-collection",
        siteId: site.id,
        title: "test collection",
        type: "CollectionPage",
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "NOT_FOUND",
          message: "Parent collection does not exist",
        }),
      )
      expect(auditSpy).not.toHaveBeenCalled()
      await assertAuditLogRows()
    })

    it("should create a collection page even with duplicate permalink if `siteId` is different", async () => {
      // Arrange
      const duplicatePermalink = "duplicate-permalink"
      const { site, collection } = await setupCollection({
        permalink: duplicatePermalink,
      })
      const { site: secondSite, collection: secondCollection } =
        await setupCollection({ permalink: duplicatePermalink })
      await setupAdminPermissions({
        siteId: secondSite.id,
        userId: session.userId,
      })
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId,
      })
      await setupPageResource({
        parentId: secondCollection.id,
        permalink: "test-collection",
        resourceType: "CollectionPage",
        siteId: secondSite.id,
        title: "test collection",
      })

      // Act
      const result = await caller.createCollectionPage({
        collectionId: Number(collection.id),
        permalink: "test-collection",
        siteId: site.id,
        title: "test collection",
        type: "CollectionPage",
      })

      // Assert
      const actualCollectionPage = await getCollectionItemByPermalink(
        "test-collection",
        collection.id,
      )
      expect(result).toMatchObject({ pageId: actualCollectionPage.id })
      expect(auditSpy).toHaveBeenCalledTimes(1)
      const auditEntry = await db
        .selectFrom("AuditLog")
        .where("eventType", "=", "ResourceCreate")
        .orderBy("AuditLog.createdAt desc")
        .selectAll()
        .executeTakeFirstOrThrow()
      expect(auditEntry).toBeDefined()
      expect(auditEntry.delta.after!).toMatchObject({
        resource: omit(actualCollectionPage, ["updatedAt", "createdAt"]),
      })
    })

    it("should create a collection page", async () => {
      // Arrange
      const permalink = "test-collection-999"
      const { collection, site } = await setupCollection()

      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = await caller.createCollectionPage({
        collectionId: Number(collection.id),
        permalink,
        siteId: site.id,
        title: "test collection",
        type: "CollectionPage",
      })

      // Assert
      const actualCollectionPage = await getCollectionItemByPermalink(
        permalink,
        collection.id,
      )
      expect(result).toMatchObject({ pageId: actualCollectionPage.id })
      expect(auditSpy).toHaveBeenCalled()
      const auditEntry = await db
        .selectFrom("AuditLog")
        .where("eventType", "=", "ResourceCreate")
        .selectAll()
        .executeTakeFirstOrThrow()
      expect(auditEntry.delta.after!).toMatchObject({
        resource: { id: result.pageId },
      })
      expect(auditEntry.userId).toBe(session.userId)
    })

    it("should throw 403 if user does not have access to the site", async () => {
      // Arrange
      const permalinkToUse = "test-collection-777"
      const { collection, site } = await setupCollection()

      // Act
      const result = caller.createCollectionPage({
        collectionId: Number(collection.id),
        permalink: permalinkToUse,
        siteId: site.id,
        title: "test collection",
        type: "CollectionPage",
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )
      await assertAuditLogRows()
    })

    it.skip("should throw 403 if user does not have write access to the parent collection", async () => {})
  })

  describe("list", () => {
    it("should throw 401 if not logged in", async () => {
      // Act
      const result = unauthedCaller.list({
        resourceId: -1,
        siteId: 1,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should throw 403 if user does not have read access to the site", async () => {
      // Arrange
      const { collection, site } = await setupCollection()

      // Act
      const result = caller.list({
        resourceId: Number(collection.id),
        siteId: site.id,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )
    })

    it("should return 200", async () => {
      // Arrange
      const { collection, site } = await setupCollection()
      await setupEditorPermissions({ siteId: site.id, userId: session.userId })

      // Act
      const result = await caller.list({
        resourceId: Number(collection.id),
        siteId: site.id,
      })

      // Assert
      expect(result).toEqual(expect.any(Array))
    })

    it("should return deterministic paginated results when items share the same type and title", async () => {
      // Arrange: Create 4 CollectionPages with identical title to trigger non-deterministic
      // ordering without a tie-breaker. Tests regression of offset/limit pagination bug.
      const { collection, site } = await setupCollection()
      await setupEditorPermissions({ siteId: site.id, userId: session.userId })

      const sharedTitle = "Identical Title"
      const permalinks = ["page-1", "page-2", "page-3", "page-4"]
      const pages = await Promise.all(
        permalinks.map( async (permalink) =>
          setupPageResource({
            parentId: collection.id,
            permalink,
            resourceType: ResourceType.CollectionPage,
            siteId: site.id,
            title: sharedTitle,
          }),
        ),
      )

      // Act: Fetch two pages with limit=2
      const page1First = await caller.list({
        limit: 2,
        offset: 0,
        resourceId: Number(collection.id),
        siteId: site.id,
      })
      const page1Second = await caller.list({
        limit: 2,
        offset: 0,
        resourceId: Number(collection.id),
        siteId: site.id,
      })
      const page2Result = await caller.list({
        limit: 2,
        offset: 2,
        resourceId: Number(collection.id),
        siteId: site.id,
      })

      // Assert: Repeated page 1 calls return identical results (deterministic ordering)
      expect(page1First.map((r) => r.id)).toEqual(page1Second.map((r) => r.id))

      // Assert: No duplicate IDs across pages (pagination consistency)
      const page1Ids = new Set(page1First.map((r) => r.id))
      const page2Ids = new Set(page2Result.map((r) => r.id))
      const overlap = [...page1Ids].filter((id) => page2Ids.has(id))
      expect(overlap).toHaveLength(0)

      // Assert: All 4 items are returned across pages (no items skipped)
      const allIds = new Set([...page1Ids, ...page2Ids])
      const expectedIds = new Set(pages.map((p) => p.page.id))
      expect(allIds).toEqual(expectedIds)
    })

    it("should sort by title ascending when orderBy is title-asc", async () => {
      // Arrange
      const { collection, site } = await setupCollection()
      await setupEditorPermissions({ siteId: site.id, userId: session.userId })

      await setupPageResource({
        parentId: collection.id,
        permalink: "charlie",
        resourceType: ResourceType.CollectionPage,
        siteId: site.id,
        title: "Charlie",
      })
      await setupPageResource({
        parentId: collection.id,
        permalink: "alpha",
        resourceType: ResourceType.CollectionPage,
        siteId: site.id,
        title: "Alpha",
      })
      await setupPageResource({
        parentId: collection.id,
        permalink: "bravo",
        resourceType: ResourceType.CollectionPage,
        siteId: site.id,
        title: "Bravo",
      })

      // Act
      const result = await caller.list({
        orderBy: "title-asc",
        resourceId: Number(collection.id),
        siteId: site.id,
      })

      // Assert
      const titles = result.map((r) => r.title)
      expect(titles).toEqual(["Alpha", "Bravo", "Charlie"])
    })

    it("should sort case-insensitively when orderBy is title-asc", async () => {
      // Arrange: titles chosen so a case-sensitive (byte-order) sort would
      // put "Banana" before "apple" - a naive `title asc` would return
      // ["Banana", "apple", "cherry"], which isn't what a user means by
      // "Alphabetical".
      const { collection, site } = await setupCollection()
      await setupEditorPermissions({ siteId: site.id, userId: session.userId })

      await setupPageResource({
        parentId: collection.id,
        permalink: "cherry",
        resourceType: ResourceType.CollectionPage,
        siteId: site.id,
        title: "cherry",
      })
      await setupPageResource({
        parentId: collection.id,
        permalink: "apple",
        resourceType: ResourceType.CollectionPage,
        siteId: site.id,
        title: "apple",
      })
      await setupPageResource({
        parentId: collection.id,
        permalink: "banana",
        resourceType: ResourceType.CollectionPage,
        siteId: site.id,
        title: "Banana",
      })

      // Act
      const result = await caller.list({
        orderBy: "title-asc",
        resourceId: Number(collection.id),
        siteId: site.id,
      })

      // Assert
      const titles = result.map((r) => r.title)
      expect(titles).toEqual(["apple", "Banana", "cherry"])
    })

    it("should sort by permalink ascending when orderBy is permalink-asc", async () => {
      // Arrange: titles are intentionally out of permalink order
      const { collection, site } = await setupCollection()
      await setupEditorPermissions({ siteId: site.id, userId: session.userId })

      await setupPageResource({
        parentId: collection.id,
        permalink: "charlie",
        resourceType: ResourceType.CollectionPage,
        siteId: site.id,
        title: "Zulu",
      })
      await setupPageResource({
        parentId: collection.id,
        permalink: "alpha",
        resourceType: ResourceType.CollectionPage,
        siteId: site.id,
        title: "Alpha",
      })
      await setupPageResource({
        parentId: collection.id,
        permalink: "bravo",
        resourceType: ResourceType.CollectionPage,
        siteId: site.id,
        title: "Mike",
      })

      // Act
      const result = await caller.list({
        orderBy: "permalink-asc",
        resourceId: Number(collection.id),
        siteId: site.id,
      })

      // Assert
      const permalinks = result.map((r) => r.permalink)
      expect(permalinks).toEqual(["alpha", "bravo", "charlie"])
    })

    it("should sort case-insensitively when orderBy is permalink-asc", async () => {
      // Arrange
      const { collection, site } = await setupCollection()
      await setupEditorPermissions({ siteId: site.id, userId: session.userId })

      await setupPageResource({
        parentId: collection.id,
        permalink: "Cherry",
        resourceType: ResourceType.CollectionPage,
        siteId: site.id,
        title: "Page C",
      })
      await setupPageResource({
        parentId: collection.id,
        permalink: "apple",
        resourceType: ResourceType.CollectionPage,
        siteId: site.id,
        title: "Page A",
      })
      await setupPageResource({
        parentId: collection.id,
        permalink: "Banana",
        resourceType: ResourceType.CollectionPage,
        siteId: site.id,
        title: "Page B",
      })

      // Act
      const result = await caller.list({
        orderBy: "permalink-asc",
        resourceId: Number(collection.id),
        siteId: site.id,
      })

      // Assert
      const permalinks = result.map((r) => r.permalink)
      expect(permalinks).toEqual(["apple", "Banana", "Cherry"])
    })

    it("should sort CollectionLinks by title and CollectionPages by permalink when orderBy is permalink-asc", async () => {
      // Arrange: link permalink is hidden and random; ordering must use title
      const { collection, site } = await setupCollection()
      await setupEditorPermissions({ siteId: site.id, userId: session.userId })

      await setupPageResource({
        parentId: collection.id,
        permalink: "alpha",
        resourceType: ResourceType.CollectionPage,
        siteId: site.id,
        title: "Zulu",
      })
      await setupCollectionLink({
        collectionId: collection.id,
        permalink: "zzz-hidden-link-permalink",
        siteId: site.id,
        title: "Bravo",
      })
      await setupPageResource({
        parentId: collection.id,
        permalink: "charlie",
        resourceType: ResourceType.CollectionPage,
        siteId: site.id,
        title: "Alpha",
      })

      // Act
      const result = await caller.list({
        orderBy: "permalink-asc",
        resourceId: Number(collection.id),
        siteId: site.id,
      })

      // Assert
      expect(result.map((r) => r.title)).toEqual(["Zulu", "Bravo", "Alpha"])
      expect(result.map((r) => r.type)).toEqual([
        ResourceType.CollectionPage,
        ResourceType.CollectionLink,
        ResourceType.CollectionPage,
      ])
    })

    it("should sort by updatedAt descending when orderBy is updated-desc", async () => {
      // Arrange
      const { collection, site } = await setupCollection()
      await setupEditorPermissions({ siteId: site.id, userId: session.userId })

      const page1 = await setupPageResource({
        parentId: collection.id,
        permalink: "first",
        resourceType: ResourceType.CollectionPage,
        siteId: site.id,
        title: "First",
      })

      await setupPageResource({
        parentId: collection.id,
        permalink: "second",
        resourceType: ResourceType.CollectionPage,
        siteId: site.id,
        title: "Second",
      })

      // Update the first page so it has a newer updatedAt
      await db
        .updateTable("Resource")
        .set({ title: "First Updated" })
        .where("id", "=", page1.page.id)
        .execute()

      // Act
      const result = await caller.list({
        orderBy: "updated-desc",
        resourceId: Number(collection.id),
        siteId: site.id,
      })

      // Assert: First Updated should appear before Second since it was updated more recently
      expect(result[0]?.title).toEqual("First Updated")
      expect(result[1]?.title).toEqual("Second")
    })

    it("should default to updated-desc ordering when orderBy is not specified", async () => {
      // Arrange
      const { collection, site } = await setupCollection()
      await setupEditorPermissions({ siteId: site.id, userId: session.userId })

      const page1 = await setupPageResource({
        parentId: collection.id,
        permalink: "older",
        resourceType: ResourceType.CollectionPage,
        siteId: site.id,
        title: "Older",
      })

      await setupPageResource({
        parentId: collection.id,
        permalink: "newer",
        resourceType: ResourceType.CollectionPage,
        siteId: site.id,
        title: "Newer",
      })

      // Update the first page so it has a newer updatedAt
      await db
        .updateTable("Resource")
        .set({ title: "Older Now Latest" })
        .where("id", "=", page1.page.id)
        .execute()

      // Act - no orderBy specified, should default to updated-desc
      const result = await caller.list({
        resourceId: Number(collection.id),
        siteId: site.id,
      })

      // Assert
      expect(result[0]?.title).toEqual("Older Now Latest")
      expect(result[1]?.title).toEqual("Newer")
    })

    it("should break ties using resource id ascending", async () => {
      // Arrange
      const { collection, site } = await setupCollection()
      await setupEditorPermissions({ siteId: site.id, userId: session.userId })

      // Create pages with the same title so the primary sort (title-asc) ties
      const pageA = await setupPageResource({
        parentId: collection.id,
        permalink: "same-title-1",
        resourceType: ResourceType.CollectionPage,
        siteId: site.id,
        title: "Same Title",
      })
      const pageB = await setupPageResource({
        parentId: collection.id,
        permalink: "same-title-2",
        resourceType: ResourceType.CollectionPage,
        siteId: site.id,
        title: "Same Title",
      })

      // Act
      const result = await caller.list({
        orderBy: "title-asc",
        resourceId: Number(collection.id),
        siteId: site.id,
      })

      // Assert: both have the same title, so tie-break by id ascending
      expect(result).toHaveLength(2)
      expect(Number(result[0]?.id)).toBeLessThan(Number(result[1]?.id))
      expect(result[0]?.id).toEqual(pageA.page.id)
      expect(result[1]?.id).toEqual(pageB.page.id)
    })
  })

  describe("readCollectionLink", () => {
    it("should throw 401 if not logged in", async () => {
      // Act
      const result = unauthedCaller.readCollectionLink({
        linkId: 999,
        siteId: 1,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should throw 403 if user does not have read access to the site", async () => {
      // Arrange
      const { collection, site } = await setupCollection()

      // Act
      const result = caller.readCollectionLink({
        linkId: Number(collection.id),
        siteId: site.id,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )
    })

    it("should return 200", async () => {
      // Arrange
      const { collection, site } = await setupCollection()
      const { collectionLink, blob } = await setupCollectionLink({
        collectionId: collection.id,
        siteId: site.id,
        state: ResourceState.Published,
        userId: (await setupUser({})).id,
      })
      await setupEditorPermissions({ siteId: site.id, userId: session.userId })

      // Act
      const result = await caller.readCollectionLink({
        linkId: Number(collectionLink.id),
        siteId: site.id,
      })

      // Assert
      expect(result).toMatchObject({
        content: blob.content,
        title: collectionLink.title,
      })
    })
  })

  describe("getMetadata", () => {
    it("should throw 401 if not logged in", async () => {
      // Act
      const result = unauthedCaller.getMetadata({
        resourceId: -1,
        siteId: 1,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should throw 403 if `siteId` does not exist (no access to that site)", async () => {
      // Arrange
      const invalidSiteId = 999
      const { site } = await setupSite()
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId,
      })
      expect(site.id).not.toEqual(invalidSiteId)

      // Act
      const result = caller.getMetadata({
        resourceId: 1,
        siteId: invalidSiteId,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )
    })

    it("should throw 404 if `collectionId` does not exist", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = caller.getMetadata({
        resourceId: 999,
        siteId: site.id,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "NOT_FOUND",
          message: "Collection not found",
        }),
      )
    })

    it("should throw 403 if user does not have read access to the site", async () => {
      // Arrange
      const { collection, site } = await setupCollection()

      // Act
      const result = caller.getMetadata({
        resourceId: Number(collection.id),
        siteId: site.id,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )
    })

    it("should return 200", async () => {
      // Arrange
      const { collection, site } = await setupCollection()
      await setupAdminPermissions({ siteId: site.id, userId: session.userId })

      // Act
      const result = await caller.getMetadata({
        resourceId: Number(collection.id),
        siteId: site.id,
      })

      // Assert
      const expected = await db
        .selectFrom("Resource")
        .select(["Resource.title", "Resource.permalink", "Resource.parentId"])
        .where("id", "=", collection.id)
        .executeTakeFirst()
      expect(result).toMatchObject(expected!)
    })
  })

  describe("readCollectionLink", () => {
    it("should throw 401 if not logged in", async () => {
      // Act
      const { site } = await setupCollection()
      const result = unauthedCaller.readCollectionLink({
        linkId: 999,
        siteId: site.id,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
      expect(auditSpy).not.toHaveBeenCalled()
    })

    it("should throw 404 if reading a non-existent `linkId`", async () => {
      // Arrange
      const { site } = await setupCollection()
      await setupAdminPermissions({ siteId: site.id, userId: session.userId })

      // Act
      const expected = caller.readCollectionLink({
        linkId: 999,
        siteId: site.id,
      })

      // Assert
      await expect(expected).rejects.toThrow(
        new TRPCError({
          code: "NOT_FOUND",
          message: "Unable to find the requested collection link",
        }),
      )
      expect(auditSpy).not.toHaveBeenCalled()
    })

    it("should throw 404 if the resource type is not a `CollectionLink`", async () => {
      // Arrange
      const { site, collection } = await setupCollection()
      await setupAdminPermissions({ siteId: site.id, userId: session.userId })

      // Act
      const expected = caller.readCollectionLink({
        linkId: Number(collection.id),
        siteId: site.id,
      })

      // Assert
      await expect(expected).rejects.toThrow(
        new TRPCError({
          code: "NOT_FOUND",
          message: "Unable to find the requested collection link",
        }),
      )
      expect(auditSpy).not.toHaveBeenCalled()
    })

    it("should throw 403 if the site does not exist", async () => {
      // Arrange
      const { page } = await setupPageResource({
        resourceType: "CollectionLink",
      })

      // Act
      const expected = caller.readCollectionLink({
        linkId: Number(page.id),
        siteId: 999,
      })

      // Assert
      await expect(expected).rejects.toThrow(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )
      expect(auditSpy).not.toHaveBeenCalled()
    })

    it("should throw 403 if the user does not have `read` permissions", async () => {
      // Arrange
      const { page, site } = await setupPageResource({
        resourceType: "CollectionLink",
      })

      // Act
      const expected = caller.readCollectionLink({
        linkId: Number(page.id),
        siteId: site.id,
      })

      // Assert
      await expect(expected).rejects.toThrow(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )
      expect(auditSpy).not.toHaveBeenCalled()
    })
    it("should read the link successfully", async () => {
      // Arrange
      const { collection, site } = await setupCollection()
      const { page, blob } = await setupPageResource({
        parentId: collection.id,
        resourceType: ResourceType.CollectionLink,
        siteId: site.id,
      })
      await setupAdminPermissions({ siteId: site.id, userId: session.userId })

      // Act
      const expected = await caller.readCollectionLink({
        linkId: Number(page.id),
        siteId: site.id,
      })

      // Assert
      expect(expected.title).toEqual(page.title)
      expect(expected.content).toEqual(blob.content)
    })
  })

  describe("updateCollectionLink", () => {
    it("should throw 401 if not logged in", async () => {
      // Act
      const { site } = await setupCollection()
      const result = unauthedCaller.updateCollectionLink({
        category: "category",
        linkId: 999,
        ref: "1",
        siteId: site.id,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
      expect(auditSpy).not.toHaveBeenCalled()
      await assertAuditLogRows()
    })

    it("should throw 404 if updating a non-existent `linkId`", async () => {
      // Arrange
      const { site } = await setupCollection()
      await setupAdminPermissions({ siteId: site.id, userId: session.userId })

      // Act
      const expected = caller.updateCollectionLink({
        category: "category",
        linkId: 999,
        ref: "1",
        siteId: site.id,
      })

      // Assert
      await expect(expected).rejects.toThrow(
        new TRPCError({
          code: "NOT_FOUND",
          message: "Unable to find the requested collection link",
        }),
      )
      expect(auditSpy).not.toHaveBeenCalled()
      await assertAuditLogRows()
    })

    it("should throw 404 if the resource type is not a `CollectionLink`", async () => {
      // Arrange
      const { site, collection } = await setupCollection()
      await setupAdminPermissions({ siteId: site.id, userId: session.userId })

      // Act
      const expected = caller.updateCollectionLink({
        category: "category",
        linkId: Number(collection.id),
        ref: "1",
        siteId: site.id,
      })

      // Assert
      await expect(expected).rejects.toThrow(
        new TRPCError({
          code: "NOT_FOUND",
          message: "Unable to find the requested collection link",
        }),
      )
      expect(auditSpy).not.toHaveBeenCalled()
      await assertAuditLogRows()
    })

    it("should throw 403 if the site does not exist", async () => {
      // Arrange
      const { page } = await setupPageResource({
        resourceType: "CollectionLink",
      })

      // Act
      const expected = caller.updateCollectionLink({
        category: "category",
        linkId: Number(page.id),
        ref: "1",
        siteId: 999,
      })

      // Assert
      await expect(expected).rejects.toThrow(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )
      expect(auditSpy).not.toHaveBeenCalled()
      await assertAuditLogRows()
    })

    it("should throw 403 if the user does not have `update` permissions", async () => {
      // Arrange
      const { page, site } = await setupPageResource({
        resourceType: "CollectionLink",
      })

      // Act
      const expected = caller.updateCollectionLink({
        category: "category",
        linkId: Number(page.id),
        ref: "1",
        siteId: site.id,
      })

      // Assert
      await expect(expected).rejects.toThrow(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )
      expect(auditSpy).not.toHaveBeenCalled()
      await assertAuditLogRows()
    })

    it("should create a new `draftBlob` if it is currently `null`", async () => {
      // Arrange
      const { page, site } = await setupPageResource({
        resourceType: "CollectionLink",
        state: "Published",
        userId: session.userId,
      })
      await setupAdminPermissions({ siteId: site.id, userId: session.userId })
      expect(page.draftBlobId).toBe(null)

      // Act
      const originalBlob = await db
        .transaction()
        .execute( async (tx) => getBlobOfResource({ db: tx, resourceId: page.id }))

      // Assert
      const expected = await caller.updateCollectionLink({
        category: "category",
        linkId: Number(page.id),
        ref: "1",
        siteId: site.id,
      })

      expect(auditSpy).toHaveBeenCalled()
      await assertAuditLogRows(1)
      const auditEntry = await db
        .selectFrom("AuditLog")
        .where("eventType", "=", "ResourceUpdate")
        .selectAll()
        .executeTakeFirstOrThrow()
      expect(auditEntry.delta.before!).toMatchObject({
        blob: omit(originalBlob, ["createdAt", "updatedAt"]),
        resource: omit(page, ["createdAt", "updatedAt"]),
      })
      expect(auditEntry.delta.after!).toMatchObject({
        blob: omit(expected, ["createdAt", "updatedAt"]),
        resource: omit(page, ["createdAt", "updatedAt"]),
      })
      expect(auditEntry.userId).toBe(session.userId)
      const actual = await getCollectionItemByPermalink(
        page.permalink,
        page.parentId,
      )
      expect(actual.draftBlobId).toEqual(expected.id)
      expect(expected.content.content).toEqual([])
    })

    it("should update the collection link successfully", async () => {
      // Arrange
      const { blob, page, site } = await setupPageResource({
        resourceType: "CollectionLink",
      })
      const originalBlob = await db
        .transaction()
        .execute( async (tx) => getBlobOfResource({ db: tx, resourceId: page.id }))
      await setupAdminPermissions({ siteId: site.id, userId: session.userId })

      // Act
      const expected = await caller.updateCollectionLink({
        category: "category",
        linkId: Number(page.id),
        ref: "1",
        siteId: site.id,
      })

      // Assert
      expect(auditSpy).toHaveBeenCalled()
      await assertAuditLogRows(1)
      const auditEntry = await db
        .selectFrom("AuditLog")
        .where("eventType", "=", "ResourceUpdate")
        .selectAll()
        .executeTakeFirstOrThrow()
      expect(auditEntry.delta.before!).toMatchObject({
        blob: omit(originalBlob, ["createdAt", "updatedAt"]),
        resource: omit(page, ["createdAt", "updatedAt"]),
      })
      expect(auditEntry.delta.after!).toMatchObject({
        blob: omit(expected, ["createdAt", "updatedAt"]),
        resource: omit(page, ["createdAt", "updatedAt"]),
      })
      expect(auditEntry.userId).toBe(session.userId)
      // NOTE: For collection links, they have no content.
      // During our update, we only update the `page` property
      // and make the content the default collection link content
      // which is an empty array
      expect(expected.content.content).toEqual([])
      expect(expected.id).toEqual(blob.id)
    })

    it("should store a valid date in `dd/MM/yyyy` format", async () => {
      // Arrange
      const { page, site } = await setupPageResource({
        resourceType: "CollectionLink",
      })
      await setupAdminPermissions({ siteId: site.id, userId: session.userId })

      // Act
      const expected = await caller.updateCollectionLink({
        category: "category",
        date: "31/01/2024",
        linkId: Number(page.id),
        ref: "1",
        siteId: site.id,
      })

      // Assert
      // SAFETY: article page content under test includes an optional date field.
      expect((expected.content.page as { date?: string }).date).toEqual(
        "31/01/2024",
      )
    })

    it("should reject an invalid date", async () => {
      // Arrange
      const { page, site } = await setupPageResource({
        resourceType: "CollectionLink",
      })
      await setupAdminPermissions({ siteId: site.id, userId: session.userId })

      // Act
      // 29 Feb 2023 is invalid as 2023 is not a leap year.
      const result = caller.updateCollectionLink({
        category: "category",
        date: "29/02/2023",
        linkId: Number(page.id),
        ref: "1",
        siteId: site.id,
      })

      // Assert
      await expect(result).rejects.toMatchObject({ code: "BAD_REQUEST" })
    })

    it.skip("should throw when trying to update to a deleted `ref`")

    it.skip("should throw when trying to update to an invalid `ref`")
  })

  describe("getCollections", () => {
    it("should throw 401 if not logged in", async () => {
      // Act
      const result = unauthedCaller.getCollections({
        siteId: 1,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should throw 403 if user does not have read access to the site", async () => {
      // Arrange
      const { site } = await setupSite()

      // Act
      const result = caller.getCollections({
        siteId: site.id,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )
    })

    it("should return empty array when no collections exist", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupEditorPermissions({ siteId: site.id, userId: session.userId })

      // Act
      const result = await caller.getCollections({
        siteId: site.id,
      })

      // Assert
      expect(result).toEqual([])
    })

    it("should return all collections for the site ordered by title (default behavior)", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupEditorPermissions({ siteId: site.id, userId: session.userId })

      // Create collections with different titles to test ordering
      const { collection: collection1 } = await setupCollection({
        permalink: "zebra-collection",
        siteId: site.id,
        title: "Zebra Collection",
      })
      const { collection: collection2 } = await setupCollection({
        permalink: "alpha-collection",
        siteId: site.id,
        title: "Alpha Collection",
      })
      const { collection: collection3 } = await setupCollection({
        permalink: "beta-collection",
        siteId: site.id,
        title: "Beta Collection",
      })

      // Act
      const result = await caller.getCollections({
        siteId: site.id,
      })

      // Assert
      expect(result).toHaveLength(3)
      expect(result[0]?.title).toBe("Alpha Collection")
      expect(result[1]?.title).toBe("Beta Collection")
      expect(result[2]?.title).toBe("Zebra Collection")
      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: collection1.id }),
          expect.objectContaining({ id: collection2.id }),
          expect.objectContaining({ id: collection3.id }),
        ]),
      )
    })

    it("should only return collections for the specified site", async () => {
      // Arrange
      const { site: site1 } = await setupSite()
      const { site: site2 } = await setupSite()
      await setupEditorPermissions({ siteId: site1.id, userId: session.userId })
      await setupEditorPermissions({ siteId: site2.id, userId: session.userId })

      // Create collections in different sites
      const { collection } = await setupCollection({
        siteId: site1.id,
        title: "Site 1 Collection",
      })
      await setupCollection({
        siteId: site2.id,
        title: "Site 2 Collection",
      })

      // Act
      const result = await caller.getCollections({
        siteId: site1.id,
      })

      // Assert
      expect(result).toHaveLength(1)
      expect(result[0]?.title).toBe("Site 1 Collection")
      expect(result[0]?.id).toBe(collection.id)
    })

    it("should only return resources of type Collection", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupEditorPermissions({ siteId: site.id, userId: session.userId })

      // Create a collection and other resource types
      const { collection } = await setupCollection({
        siteId: site.id,
        title: "Test Collection",
      })
      await setupPageResource({
        resourceType: "Page",
        siteId: site.id,
        title: "Test Page",
      })
      await setupFolder({
        siteId: site.id,
        title: "Test Folder",
      })

      // Act
      const result = await caller.getCollections({
        siteId: site.id,
      })

      // Assert
      expect(result).toHaveLength(1)
      expect(result[0]?.title).toBe("Test Collection")
      expect(result[0]?.id).toBe(collection.id)
      expect(result[0]?.type).toBe(ResourceType.Collection)
    })

    it("should return only collections that have children when hasChildren is true", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupEditorPermissions({ siteId: site.id, userId: session.userId })

      // Create collections
      const { collection: collectionWithChildren } = await setupCollection({
        permalink: "collection-with-children",
        siteId: site.id,
      })
      const { collection: _emptyCollection } = await setupCollection({
        permalink: "empty-collection",
        siteId: site.id,
      })

      // Add children to the first collection
      await setupPageResource({
        parentId: collectionWithChildren.id,
        permalink: "child-page",
        resourceType: ResourceType.CollectionPage,
        siteId: site.id,
      })

      // Act
      const result = await caller.getCollections({
        hasChildren: true,
        siteId: site.id,
      })

      // Assert
      expect(result).toHaveLength(1)
      expect(result[0]?.id).toBe(collectionWithChildren.id)
    })
  })

  describe("countTagOptionsUsage", () => {
    const TAG_OPTION_ID = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"
    const TAG_OPTION_B = "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12"

    async function setupCollectionWithIndexPage() {
      const { collection, site } = await setupCollection()
      const { page: indexPage } = await setupPageResource({
        parentId: collection.id,
        resourceType: ResourceType.IndexPage,
        siteId: site.id,
      })
      return { collection, indexPage, site }
    }

    it("should throw 401 if not logged in", async () => {
      // Arrange
      const { site, indexPage } = await setupCollectionWithIndexPage()
      await setupAdminPermissions({ siteId: site.id, userId: session.userId })

      // Act
      const result = unauthedCaller.countTagOptionsUsage({
        pageId: Number(indexPage.id),
        siteId: site.id,
        tagOptionIds: [TAG_OPTION_ID],
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should throw 403 if user does not have read access to the site", async () => {
      // Arrange
      const { site, indexPage } = await setupCollectionWithIndexPage()

      // Act
      const result = caller.countTagOptionsUsage({
        pageId: Number(indexPage.id),
        siteId: site.id,
        tagOptionIds: [TAG_OPTION_ID],
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

    it("should reject when tagOptionIds exceeds the maximum length", async () => {
      // Arrange
      const { site, indexPage } = await setupCollectionWithIndexPage()
      await setupEditorPermissions({ siteId: site.id, userId: session.userId })

      // Act
      const result = caller.countTagOptionsUsage({
        pageId: Number(indexPage.id),
        siteId: site.id,
        tagOptionIds: Array.from({ length: 100 + 1 }, () => randomUUID()),
      })

      // Assert
      await expect(result).rejects.toMatchObject({ code: "BAD_REQUEST" })
    })

    it("should throw 404 if index page does not exist", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupEditorPermissions({ siteId: site.id, userId: session.userId })

      // Act
      const result = caller.countTagOptionsUsage({
        pageId: 99999,
        siteId: site.id,
        tagOptionIds: [TAG_OPTION_ID],
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({
          code: "NOT_FOUND",
          message: "Collection index page not found",
        }),
      )
    })

    it("should throw 404 if indexPageId is not a collection index page", async () => {
      // Arrange
      const { site, page } = await setupPageResource({ resourceType: "Page" })
      await setupEditorPermissions({ siteId: site.id, userId: session.userId })

      // Act
      const result = caller.countTagOptionsUsage({
        pageId: Number(page.id),
        siteId: site.id,
        tagOptionIds: [TAG_OPTION_ID],
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({
          code: "NOT_FOUND",
          message: "Collection index page not found",
        }),
      )
    })

    it("should throw 404 when index page belongs to another site", async () => {
      // Arrange
      const { site: siteA, indexPage } = await setupCollectionWithIndexPage()
      const { site: siteB } = await setupSite()
      await setupEditorPermissions({ siteId: siteA.id, userId: session.userId })
      await setupEditorPermissions({ siteId: siteB.id, userId: session.userId })

      // Act
      const result = caller.countTagOptionsUsage({
        pageId: Number(indexPage.id),
        siteId: siteB.id,
        tagOptionIds: [TAG_OPTION_ID],
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({
          code: "NOT_FOUND",
          message: "Collection index page not found",
        }),
      )
    })

    it("should throw 404 when index page has no parent collection", async () => {
      // Arrange
      const { site, indexPage } = await setupCollectionWithIndexPage()
      await setupEditorPermissions({ siteId: site.id, userId: session.userId })
      await db
        .updateTable("Resource")
        .set({ parentId: null })
        .where("id", "=", indexPage.id)
        .execute()

      // Act
      const result = caller.countTagOptionsUsage({
        pageId: Number(indexPage.id),
        siteId: site.id,
        tagOptionIds: [TAG_OPTION_ID],
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({
          code: "NOT_FOUND",
          message: "Collection index page has no parent collection",
        }),
      )
    })

    it("should return 0 when there are no child items", async () => {
      // Arrange
      const { site, indexPage } = await setupCollectionWithIndexPage()
      await setupEditorPermissions({ siteId: site.id, userId: session.userId })

      // Act
      const result = await caller.countTagOptionsUsage({
        pageId: Number(indexPage.id),
        siteId: site.id,
        tagOptionIds: [TAG_OPTION_ID],
      })

      // Assert
      expect(result).toEqual({ count: 0 })
    })

    it("should return 0 when no item references the tag option", async () => {
      // Arrange
      const { collection, site, indexPage } =
        await setupCollectionWithIndexPage()
      await setupEditorPermissions({ siteId: site.id, userId: session.userId })
      await setupPageResource({
        parentId: collection.id,
        permalink: "page-a",
        resourceType: ResourceType.CollectionPage,
        siteId: site.id,
      })

      // Act
      const result = await caller.countTagOptionsUsage({
        pageId: Number(indexPage.id),
        siteId: site.id,
        tagOptionIds: [TAG_OPTION_ID],
      })

      // Assert
      expect(result).toEqual({ count: 0 })
    })

    it("should return 1 when a collection page draft blob lists the tag", async () => {
      // Arrange
      const { collection, site, indexPage } =
        await setupCollectionWithIndexPage()
      await setupEditorPermissions({ siteId: site.id, userId: session.userId })
      await setupCollectionPage({
        parentId: collection.id,
        permalink: "tagged-page",
        siteId: site.id,
        tagged: [TAG_OPTION_ID],
      })

      // Act
      const result = await caller.countTagOptionsUsage({
        pageId: Number(indexPage.id),
        siteId: site.id,
        tagOptionIds: [TAG_OPTION_ID],
      })

      // Assert
      expect(result).toEqual({ count: 1 })
    })

    it("should return 1 when only the published blob lists the tag", async () => {
      // Arrange
      const { collection, site, indexPage } =
        await setupCollectionWithIndexPage()
      await setupEditorPermissions({ siteId: site.id, userId: session.userId })
      const { page } = await setupPageResource({
        parentId: collection.id,
        permalink: "pub-only",
        resourceType: ResourceType.CollectionPage,
        siteId: site.id,
      })

      const draftContent = collectionPageBlobContent()
      const publishedContent = collectionPageBlobContent([TAG_OPTION_ID])

      const draftBlob = await db
        .insertInto("Blob")
        .values({ content: jsonb(draftContent) })
        .returningAll()
        .executeTakeFirstOrThrow()
      const publishedBlob = await db
        .insertInto("Blob")
        .values({ content: jsonb(publishedContent) })
        .returningAll()
        .executeTakeFirstOrThrow()
      const version = await db
        .insertInto("Version")
        .values({
          blobId: publishedBlob.id,
          publishedBy: session.userId!,
          resourceId: page.id,
          versionNum: 1,
        })
        .returning("id")
        .executeTakeFirstOrThrow()

      await db
        .updateTable("Resource")
        .set({
          draftBlobId: draftBlob.id,
          publishedVersionId: version.id,
        })
        .where("id", "=", page.id)
        .execute()

      // Act
      const result = await caller.countTagOptionsUsage({
        pageId: Number(indexPage.id),
        siteId: site.id,
        tagOptionIds: [TAG_OPTION_ID],
      })

      // Assert
      expect(result).toEqual({ count: 1 })
    })

    it("should count a resource once when both draft and published list the tag", async () => {
      // Arrange
      const { collection, site, indexPage } =
        await setupCollectionWithIndexPage()
      await setupEditorPermissions({ siteId: site.id, userId: session.userId })
      const { page } = await setupPageResource({
        parentId: collection.id,
        permalink: "both-blobs",
        resourceType: ResourceType.CollectionPage,
        siteId: site.id,
      })

      const taggedBlob = collectionPageBlobContent([TAG_OPTION_ID])
      const draftBlob = await db
        .insertInto("Blob")
        .values({ content: jsonb(taggedBlob) })
        .returningAll()
        .executeTakeFirstOrThrow()
      const publishedBlob = await db
        .insertInto("Blob")
        .values({ content: jsonb(taggedBlob) })
        .returningAll()
        .executeTakeFirstOrThrow()
      const version = await db
        .insertInto("Version")
        .values({
          blobId: publishedBlob.id,
          publishedBy: session.userId!,
          resourceId: page.id,
          versionNum: 1,
        })
        .returning("id")
        .executeTakeFirstOrThrow()

      await db
        .updateTable("Resource")
        .set({
          draftBlobId: draftBlob.id,
          publishedVersionId: version.id,
        })
        .where("id", "=", page.id)
        .execute()

      // Act
      const result = await caller.countTagOptionsUsage({
        pageId: Number(indexPage.id),
        siteId: site.id,
        tagOptionIds: [TAG_OPTION_ID],
      })

      // Assert
      expect(result).toEqual({ count: 1 })
    })

    it("should return 2 when two child items reference the tag", async () => {
      // Arrange
      const { collection, site, indexPage } =
        await setupCollectionWithIndexPage()
      await setupEditorPermissions({ siteId: site.id, userId: session.userId })
      const { blob: blobA } = await setupPageResource({
        parentId: collection.id,
        permalink: "page-1",
        resourceType: ResourceType.CollectionPage,
        siteId: site.id,
      })
      const { blob: blobB } = await setupPageResource({
        parentId: collection.id,
        permalink: "page-2",
        resourceType: ResourceType.CollectionLink,
        siteId: site.id,
      })

      const taggedBlob = collectionPageBlobContent([TAG_OPTION_ID])
      await db
        .updateTable("Blob")
        .set({ content: jsonb(taggedBlob) })
        .where("id", "=", blobA.id)
        .execute()
      await db
        .updateTable("Blob")
        .set({ content: jsonb(taggedBlob) })
        .where("id", "=", blobB.id)
        .execute()

      // Act
      const result = await caller.countTagOptionsUsage({
        pageId: Number(indexPage.id),
        siteId: site.id,
        tagOptionIds: [TAG_OPTION_ID],
      })

      // Assert
      expect(result).toEqual({ count: 2 })
    })

    it("should return 0 when tagOptionIds is empty", async () => {
      const { site, indexPage } = await setupCollectionWithIndexPage()
      await setupEditorPermissions({ siteId: site.id, userId: session.userId })

      const result = await caller.countTagOptionsUsage({
        pageId: Number(indexPage.id),
        siteId: site.id,
        tagOptionIds: [],
      })

      expect(result).toEqual({ count: 0 })
    })

    it("should return 1 when a child item lists one of several queried tag options", async () => {
      const { collection, site, indexPage } =
        await setupCollectionWithIndexPage()
      await setupEditorPermissions({ siteId: site.id, userId: session.userId })
      await setupCollectionPage({
        parentId: collection.id,
        permalink: "tagged-page",
        siteId: site.id,
        tagged: [TAG_OPTION_ID],
      })

      const result = await caller.countTagOptionsUsage({
        pageId: Number(indexPage.id),
        siteId: site.id,
        tagOptionIds: [TAG_OPTION_ID, TAG_OPTION_B],
      })

      expect(result).toEqual({ count: 1 })
    })

    it("should count a resource once when tagged lists multiple of the queried option ids", async () => {
      const { collection, site, indexPage } =
        await setupCollectionWithIndexPage()
      await setupEditorPermissions({ siteId: site.id, userId: session.userId })
      await setupCollectionPage({
        parentId: collection.id,
        permalink: "multi-tag-page",
        siteId: site.id,
        tagged: [TAG_OPTION_ID, TAG_OPTION_B],
      })

      const result = await caller.countTagOptionsUsage({
        pageId: Number(indexPage.id),
        siteId: site.id,
        tagOptionIds: [TAG_OPTION_ID, TAG_OPTION_B],
      })

      expect(result).toEqual({ count: 1 })
    })
  })

  describe("getCollectionTags", () => {
    const TAG_CATEGORY_ID = "f47ac10b-58cc-4372-a567-0e02b2c3d479"
    const TAG_OPTION_ID = "6ba7b810-9dad-11d1-80b4-00c04fd430c8"

    const indexPageBlobWithTags = () => ({
      content: [],
      layout: "collection" as const,
      page: {
        subtitle: "Test subtitle",
        tagCategories: [
          {
            id: TAG_CATEGORY_ID,
            label: "Topic",
            isRequired: false,
            options: [{ id: TAG_OPTION_ID, label: "Technology" }],
          },
        ],
        title: "Test Collection",
      },
      version: "0.1.0",
    })

    async function setupCollectionWithIndexPage() {
      const { collection, site } = await setupCollection()
      const { page: indexPage, blob: indexBlob } = await setupPageResource({
        parentId: collection.id,
        resourceType: ResourceType.IndexPage,
        siteId: site.id,
      })
      return { collection, indexBlob, indexPage, site }
    }

    async function publishIndexPageWithTags(indexPageId: string) {
      const publishedBlob = await db
        .insertInto("Blob")
        .values({ content: jsonb(indexPageBlobWithTags()) })
        .returningAll()
        .executeTakeFirstOrThrow()
      const version = await db
        .insertInto("Version")
        .values({
          blobId: publishedBlob.id,
          publishedBy: session.userId!,
          resourceId: indexPageId,
          versionNum: 1,
        })
        .returning("id")
        .executeTakeFirstOrThrow()
      await db
        .updateTable("Resource")
        .set({ publishedVersionId: version.id })
        .where("id", "=", indexPageId)
        .execute()
    }

    it("should throw 401 if not logged in", async () => {
      // Arrange
      const { collection, site } = await setupCollection()
      const { page: collectionPage } = await setupPageResource({
        parentId: collection.id,
        resourceType: ResourceType.CollectionPage,
        siteId: site.id,
      })

      // Act
      const result = unauthedCaller.getCollectionTags({
        resourceId: Number(collectionPage.id),
        siteId: site.id,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should throw 403 if user does not have read access", async () => {
      // Arrange
      const { collection, site } = await setupCollection()
      const { page: collectionPage } = await setupPageResource({
        parentId: collection.id,
        resourceType: ResourceType.CollectionPage,
        siteId: site.id,
      })

      // Act
      const result = caller.getCollectionTags({
        resourceId: Number(collectionPage.id),
        siteId: site.id,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )
    })

    it("should return tag categories from the published blob by default", async () => {
      // Arrange
      const { collection, site, indexPage } =
        await setupCollectionWithIndexPage()
      await setupEditorPermissions({ siteId: site.id, userId: session.userId })
      await publishIndexPageWithTags(indexPage.id)
      const { page: collectionPage } = await setupPageResource({
        parentId: collection.id,
        resourceType: ResourceType.CollectionPage,
        siteId: site.id,
      })

      // Act
      const result = await caller.getCollectionTags({
        resourceId: Number(collectionPage.id),
        siteId: site.id,
      })

      // Assert
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({ id: TAG_CATEGORY_ID, label: "Topic" })
    })

    it("should return empty array when collection has no published version", async () => {
      // Arrange
      const { collection, site, indexBlob } =
        await setupCollectionWithIndexPage()
      await setupEditorPermissions({ siteId: site.id, userId: session.userId })
      // Put tags in draft only — no published version
      await db
        .updateTable("Blob")
        .set({ content: jsonb(indexPageBlobWithTags()) })
        .where("id", "=", indexBlob.id)
        .execute()
      const { page: collectionPage } = await setupPageResource({
        parentId: collection.id,
        resourceType: ResourceType.CollectionPage,
        siteId: site.id,
      })

      // Act
      const result = await caller.getCollectionTags({
        resourceId: Number(collectionPage.id),
        siteId: site.id,
      })

      // Assert: always published-only, no draft fallback
      expect(result).toHaveLength(0)
    })
  })
})
