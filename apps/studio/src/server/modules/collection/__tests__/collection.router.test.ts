import type { CollectionPagePageProps } from "@opengovsg/isomer-components"
import type { MockInstance } from "vitest"
import { TRPCError } from "@trpc/server"
import _, { omit } from "lodash"
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
import { createCollectionIndexJson } from "~/server/modules/collection/collection.service"
import { createCallerFactory } from "~/server/trpc"

import { assertAuditLogRows } from "../../audit/__tests__/utils"
import { db, jsonb, ResourceState, ResourceType } from "../../database"
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
      userId: session.userId,
      email: "test@mock.com",
      isDeleted: false,
    })
    await auth(user)
    auditSpy = vitest.spyOn(auditService, "logResourceEvent")
  })

  describe("create", () => {
    it("should throw 401 if not logged in", async () => {
      // Act
      const result = unauthedCaller.create({
        collectionTitle: "test collection",
        siteId: 1,
        permalink: "test-collection",
      })

      // Assert
      await expect(result).rejects.toThrowError(
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
        userId: session.userId,
        siteId: site.id,
      })

      // Act
      const result = caller.create({
        collectionTitle: "test folder",
        siteId: site.id,
        permalink: duplicatePermalink,
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({
          code: "CONFLICT",
          message: "A resource with the same permalink already exists",
        }),
      )
      expect(auditSpy).not.toHaveBeenCalled()
      await assertAuditLogRows()
    })

    it("should throw 404 if `siteId` does not exist", async () => {
      // Arrange
      const invalidSiteId = 999
      const { site } = await setupSite()
      await setupAdminPermissions({
        userId: session.userId,
        siteId: site.id,
      })
      expect(site.id).not.toEqual(invalidSiteId)

      // Act
      const result = caller.create({
        collectionTitle: "test collection",
        siteId: invalidSiteId,
        permalink: "test-collection",
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({
          code: "NOT_FOUND",
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
        userId: session.userId,
        siteId: site.id,
      })

      // Act
      const result = caller.create({
        collectionTitle: "test collection",
        siteId: site.id,
        permalink: "test-collection",
        parentFolderId: 999,
      })

      // Assert
      await expect(result).rejects.toThrowError(
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
        userId: session.userId,
        siteId: site.id,
      })

      // Act
      const result = caller.create({
        collectionTitle: "test collection",
        siteId: site.id,
        permalink: "test-collection",
        parentFolderId: Number(page.id),
      })

      // Assert
      await expect(result).rejects.toThrowError(
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
        userId: session.userId,
        siteId: secondSite.id,
      })

      // Act
      const result = await caller.create({
        collectionTitle: "test collection",
        siteId: secondSite.id,
        permalink: duplicatePermalink,
      })

      // Assert
      const actualCollection = await getCollectionWithPermalink({
        siteId: secondSite.id,
        permalink: duplicatePermalink,
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
        userId: session.userId,
        siteId: site.id,
      })

      // Act
      const result = await caller.create({
        collectionTitle: "test collection 999",
        siteId: site.id,
        permalink: permalinkToUse,
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
        userId: session.userId,
        siteId: site.id,
      })

      // Act
      const result = await caller.create({
        collectionTitle: "test collection",
        siteId: site.id,
        permalink: permalinkToUse,
        parentFolderId: Number(parent.id),
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
        userId: session.userId,
        siteId: site.id,
      })

      // Act
      const result = await caller.create({
        collectionTitle: "test collection",
        siteId: site.id,
        permalink: permalinkToUse,
        parentFolderId: Number(parent.id),
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
      await setupEditorPermissions({ userId: session.userId, siteId: site.id })

      // Act
      const result = caller.create({
        collectionTitle: "test collection",
        siteId: site.id,
        permalink: permalinkToUse,
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({
          code: "NOT_FOUND",
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
        siteId: site.id,
        permalink: permalinkToUse,
        parentFolderId: Number(parentFolder.id),
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({
          code: "NOT_FOUND",
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
        title: "test collection",
        type: "CollectionPage",
        siteId: site.id,
        collectionId: Number(collection.id),
        permalink: "test-collection",
      })

      // Assert
      await expect(result).rejects.toThrowError(
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
        userId: session.userId,
        siteId: site.id,
      })
      await setupPageResource({
        title: "test folder",
        resourceType: "CollectionPage",
        siteId: site.id,
        parentId: collection.id,
        permalink: duplicatePermalink,
      })

      // Act
      const result = caller.createCollectionPage({
        title: "test folder",
        type: "CollectionPage",
        siteId: site.id,
        collectionId: Number(collection.id),
        permalink: duplicatePermalink,
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({
          code: "CONFLICT",
          message: "A resource with the same permalink already exists",
        }),
      )
      expect(auditSpy).not.toHaveBeenCalled()
      await assertAuditLogRows()
    })

    it("should throw 404 if `siteId` does not exist", async () => {
      // Arrange
      const invalidSiteId = 999
      const { collection, site } = await setupCollection()
      await setupAdminPermissions({
        userId: session.userId,
        siteId: site.id,
      })
      expect(site.id).not.toEqual(invalidSiteId)

      // Act
      const result = caller.createCollectionPage({
        title: "test collection",
        type: "CollectionPage",
        siteId: 999,
        collectionId: Number(collection.id),
        permalink: "test-collection",
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({
          code: "NOT_FOUND",
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
        userId: session.userId,
        siteId: site.id,
      })

      // Act
      const result = caller.createCollectionPage({
        title: "test collection",
        type: "CollectionPage",
        siteId: site.id,
        collectionId: 999,
        permalink: "test-collection",
      })

      // Assert
      await expect(result).rejects.toThrowError(
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
        userId: session.userId,
        siteId: site.id,
      })

      // Act
      const result = caller.createCollectionPage({
        title: "test collection",
        type: "CollectionPage",
        siteId: site.id,
        collectionId: Number(page.id),
        permalink: "test-collection",
      })

      // Assert
      await expect(result).rejects.toThrowError(
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
        userId: session.userId,
        siteId: secondSite.id,
      })
      await setupAdminPermissions({
        userId: session.userId,
        siteId: site.id,
      })
      await setupPageResource({
        title: "test collection",
        resourceType: "CollectionPage",
        siteId: secondSite.id,
        parentId: secondCollection.id,
        permalink: "test-collection",
      })

      // Act
      const result = await caller.createCollectionPage({
        title: "test collection",
        type: "CollectionPage",
        siteId: site.id,
        collectionId: Number(collection.id),
        permalink: "test-collection",
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
        userId: session.userId,
        siteId: site.id,
      })

      // Act
      const result = await caller.createCollectionPage({
        title: "test collection",
        type: "CollectionPage",
        siteId: site.id,
        collectionId: Number(collection.id),
        permalink,
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
        title: "test collection",
        type: "CollectionPage",
        siteId: site.id,
        collectionId: Number(collection.id),
        permalink: permalinkToUse,
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({
          code: "NOT_FOUND",
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
        siteId: 1,
        resourceId: -1,
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should throw 403 if user does not have read access to the site", async () => {
      // Arrange
      const { collection, site } = await setupCollection()

      // Act
      const result = caller.list({
        siteId: site.id,
        resourceId: Number(collection.id),
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

    it("should return 200", async () => {
      // Arrange
      const { collection, site } = await setupCollection()
      await setupEditorPermissions({ userId: session.userId, siteId: site.id })

      // Act
      const result = await caller.list({
        siteId: site.id,
        resourceId: Number(collection.id),
      })

      // Assert
      expect(result).toEqual(expect.any(Array))
    })

    it("should return deterministic paginated results when items share the same type and title", async () => {
      // Arrange: Create 4 CollectionPages with identical title to trigger non-deterministic
      // ordering without a tie-breaker. Tests regression of offset/limit pagination bug.
      const { collection, site } = await setupCollection()
      await setupEditorPermissions({ userId: session.userId, siteId: site.id })

      const sharedTitle = "Identical Title"
      const permalinks = ["page-1", "page-2", "page-3", "page-4"]
      const pages = await Promise.all(
        permalinks.map((permalink) =>
          setupPageResource({
            siteId: site.id,
            resourceType: ResourceType.CollectionPage,
            parentId: collection.id,
            title: sharedTitle,
            permalink,
          }),
        ),
      )

      // Act: Fetch two pages with limit=2
      const page1First = await caller.list({
        siteId: site.id,
        resourceId: Number(collection.id),
        limit: 2,
        offset: 0,
      })
      const page1Second = await caller.list({
        siteId: site.id,
        resourceId: Number(collection.id),
        limit: 2,
        offset: 0,
      })
      const page2Result = await caller.list({
        siteId: site.id,
        resourceId: Number(collection.id),
        limit: 2,
        offset: 2,
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
      await setupEditorPermissions({ userId: session.userId, siteId: site.id })

      await setupPageResource({
        siteId: site.id,
        resourceType: ResourceType.CollectionPage,
        parentId: collection.id,
        title: "Charlie",
        permalink: "charlie",
      })
      await setupPageResource({
        siteId: site.id,
        resourceType: ResourceType.CollectionPage,
        parentId: collection.id,
        title: "Alpha",
        permalink: "alpha",
      })
      await setupPageResource({
        siteId: site.id,
        resourceType: ResourceType.CollectionPage,
        parentId: collection.id,
        title: "Bravo",
        permalink: "bravo",
      })

      // Act
      const result = await caller.list({
        siteId: site.id,
        resourceId: Number(collection.id),
        orderBy: "title-asc",
      })

      // Assert
      const titles = result.map((r) => r.title)
      expect(titles).toEqual(["Alpha", "Bravo", "Charlie"])
    })

    it("should sort by updatedAt descending when orderBy is updated-desc", async () => {
      // Arrange
      const { collection, site } = await setupCollection()
      await setupEditorPermissions({ userId: session.userId, siteId: site.id })

      const page1 = await setupPageResource({
        siteId: site.id,
        resourceType: ResourceType.CollectionPage,
        parentId: collection.id,
        title: "First",
        permalink: "first",
      })

      await setupPageResource({
        siteId: site.id,
        resourceType: ResourceType.CollectionPage,
        parentId: collection.id,
        title: "Second",
        permalink: "second",
      })

      // Update the first page so it has a newer updatedAt
      await db
        .updateTable("Resource")
        .set({ title: "First Updated" })
        .where("id", "=", page1.page.id)
        .execute()

      // Act
      const result = await caller.list({
        siteId: site.id,
        resourceId: Number(collection.id),
        orderBy: "updated-desc",
      })

      // Assert: First Updated should appear before Second since it was updated more recently
      expect(result[0]?.title).toEqual("First Updated")
      expect(result[1]?.title).toEqual("Second")
    })

    it("should default to updated-desc ordering when orderBy is not specified", async () => {
      // Arrange
      const { collection, site } = await setupCollection()
      await setupEditorPermissions({ userId: session.userId, siteId: site.id })

      const page1 = await setupPageResource({
        siteId: site.id,
        resourceType: ResourceType.CollectionPage,
        parentId: collection.id,
        title: "Older",
        permalink: "older",
      })

      await setupPageResource({
        siteId: site.id,
        resourceType: ResourceType.CollectionPage,
        parentId: collection.id,
        title: "Newer",
        permalink: "newer",
      })

      // Update the first page so it has a newer updatedAt
      await db
        .updateTable("Resource")
        .set({ title: "Older Now Latest" })
        .where("id", "=", page1.page.id)
        .execute()

      // Act - no orderBy specified, should default to updated-desc
      const result = await caller.list({
        siteId: site.id,
        resourceId: Number(collection.id),
      })

      // Assert
      expect(result[0]?.title).toEqual("Older Now Latest")
      expect(result[1]?.title).toEqual("Newer")
    })

    it("should break ties using resource id ascending", async () => {
      // Arrange
      const { collection, site } = await setupCollection()
      await setupEditorPermissions({ userId: session.userId, siteId: site.id })

      // Create pages with the same title so the primary sort (title-asc) ties
      const pageA = await setupPageResource({
        siteId: site.id,
        resourceType: ResourceType.CollectionPage,
        parentId: collection.id,
        title: "Same Title",
        permalink: "same-title-1",
      })
      const pageB = await setupPageResource({
        siteId: site.id,
        resourceType: ResourceType.CollectionPage,
        parentId: collection.id,
        title: "Same Title",
        permalink: "same-title-2",
      })

      // Act
      const result = await caller.list({
        siteId: site.id,
        resourceId: Number(collection.id),
        orderBy: "title-asc",
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
        siteId: 1,
        linkId: 999,
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should throw 403 if user does not have read access to the site", async () => {
      // Arrange
      const { collection, site } = await setupCollection()

      // Act
      const result = caller.readCollectionLink({
        siteId: site.id,
        linkId: Number(collection.id),
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

    it("should return 200", async () => {
      // Arrange
      const { collection, site } = await setupCollection()
      const { collectionLink, blob } = await setupCollectionLink({
        siteId: site.id,
        collectionId: collection.id,
        state: ResourceState.Published,
        userId: (await setupUser({})).id,
      })
      await setupEditorPermissions({ userId: session.userId, siteId: site.id })

      // Act
      const result = await caller.readCollectionLink({
        siteId: site.id,
        linkId: Number(collectionLink.id),
      })

      // Assert
      expect(result).toMatchObject({
        title: collectionLink.title,
        content: blob.content,
      })
    })
  })

  describe("getMetadata", () => {
    it("should throw 401 if not logged in", async () => {
      // Act
      const result = unauthedCaller.getMetadata({
        siteId: 1,
        resourceId: -1,
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should throw 404 if `siteId` does not exist", async () => {
      // Arrange
      const invalidSiteId = 999
      const { site } = await setupSite()
      await setupAdminPermissions({
        userId: session.userId,
        siteId: site.id,
      })
      expect(site.id).not.toEqual(invalidSiteId)

      // Act
      const result = caller.getMetadata({
        siteId: invalidSiteId,
        resourceId: 1,
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({
          code: "NOT_FOUND",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )
    })

    it("should throw 404 if `collectionId` does not exist", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupAdminPermissions({
        userId: session.userId,
        siteId: site.id,
      })

      // Act
      const result = caller.getMetadata({
        siteId: site.id,
        resourceId: 999,
      })

      // Assert
      await expect(result).rejects.toThrowError(
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
        siteId: site.id,
        resourceId: Number(collection.id),
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({
          code: "NOT_FOUND",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )
    })

    it("should return 200", async () => {
      // Arrange
      const { collection, site } = await setupCollection()
      await setupAdminPermissions({ userId: session.userId, siteId: site.id })

      // Act
      const result = await caller.getMetadata({
        siteId: site.id,
        resourceId: Number(collection.id),
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
        siteId: site.id,
        linkId: 999,
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
      expect(auditSpy).not.toHaveBeenCalled()
    })

    it("should throw 404 if reading a non-existent `linkId`", async () => {
      // Arrange
      const { site } = await setupCollection()
      await setupAdminPermissions({ userId: session.userId, siteId: site.id })

      // Act
      const expected = caller.readCollectionLink({
        siteId: site.id,
        linkId: 999,
      })

      // Assert
      await expect(expected).rejects.toThrowError(
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
      await setupAdminPermissions({ userId: session.userId, siteId: site.id })

      // Act
      const expected = caller.readCollectionLink({
        siteId: site.id,
        linkId: Number(collection.id),
      })

      // Assert
      await expect(expected).rejects.toThrowError(
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
        siteId: 999,
        linkId: Number(page.id),
      })

      // Assert
      await expect(expected).rejects.toThrowError(
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
        siteId: site.id,
        linkId: Number(page.id),
      })

      // Assert
      await expect(expected).rejects.toThrowError(
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
      await setupAdminPermissions({ userId: session.userId, siteId: site.id })

      // Act
      const expected = await caller.readCollectionLink({
        siteId: site.id,
        linkId: Number(page.id),
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
        siteId: site.id,
        category: "category",
        ref: "1",
        linkId: 999,
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
      expect(auditSpy).not.toHaveBeenCalled()
      await assertAuditLogRows()
    })

    it("should throw 404 if updating a non-existent `linkId`", async () => {
      // Arrange
      const { site } = await setupCollection()
      await setupAdminPermissions({ userId: session.userId, siteId: site.id })

      // Act
      const expected = caller.updateCollectionLink({
        siteId: site.id,
        category: "category",
        ref: "1",
        linkId: 999,
      })

      // Assert
      await expect(expected).rejects.toThrowError(
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
      await setupAdminPermissions({ userId: session.userId, siteId: site.id })

      // Act
      const expected = caller.updateCollectionLink({
        siteId: site.id,
        category: "category",
        ref: "1",
        linkId: Number(collection.id),
      })

      // Assert
      await expect(expected).rejects.toThrowError(
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
        siteId: 999,
        category: "category",
        ref: "1",
        linkId: Number(page.id),
      })

      // Assert
      await expect(expected).rejects.toThrowError(
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
        siteId: site.id,
        category: "category",
        ref: "1",
        linkId: Number(page.id),
      })

      // Assert
      await expect(expected).rejects.toThrowError(
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
      await setupAdminPermissions({ userId: session.userId, siteId: site.id })
      expect(page.draftBlobId).toBe(null)

      // Act
      const originalBlob = await db
        .transaction()
        .execute((tx) => getBlobOfResource({ db: tx, resourceId: page.id }))

      // Assert
      const expected = await caller.updateCollectionLink({
        siteId: site.id,
        category: "category",
        ref: "1",
        linkId: Number(page.id),
      })

      expect(auditSpy).toHaveBeenCalled()
      await assertAuditLogRows(1)
      const auditEntry = await db
        .selectFrom("AuditLog")
        .where("eventType", "=", "ResourceUpdate")
        .selectAll()
        .executeTakeFirstOrThrow()
      expect(auditEntry.delta.before!).toMatchObject({
        blob: _.omit(originalBlob, ["createdAt", "updatedAt"]),
        resource: _.omit(page, ["createdAt", "updatedAt"]),
      })
      expect(auditEntry.delta.after!).toMatchObject({
        blob: _.omit(expected, ["createdAt", "updatedAt"]),
        resource: _.omit(page, ["createdAt", "updatedAt"]),
      })
      expect(auditEntry.userId).toBe(session.userId)
      const actual = getCollectionItemByPermalink(page.permalink, page.parentId)
      expect(expected).toMatchObject(actual)
    })

    it("should update the collection link successfully", async () => {
      // Arrange
      const { blob, page, site } = await setupPageResource({
        resourceType: "CollectionLink",
      })
      const originalBlob = await db
        .transaction()
        .execute((tx) => getBlobOfResource({ db: tx, resourceId: page.id }))
      await setupAdminPermissions({ userId: session.userId, siteId: site.id })

      // Act
      const expected = await caller.updateCollectionLink({
        siteId: site.id,
        category: "category",
        ref: "1",
        linkId: Number(page.id),
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
        blob: _.omit(originalBlob, ["createdAt", "updatedAt"]),
        resource: _.omit(page, ["createdAt", "updatedAt"]),
      })
      expect(auditEntry.delta.after!).toMatchObject({
        blob: _.omit(expected, ["createdAt", "updatedAt"]),
        resource: _.omit(page, ["createdAt", "updatedAt"]),
      })
      expect(auditEntry.userId).toBe(session.userId)
      // NOTE: For collection links, they have no content.
      // During our update, we only update the `page` property
      // and make the content the default collection link content
      // which is an empty array
      expect(expected.content.content).toEqual([])
      expect(expected.id).toEqual(blob.id)
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
      await expect(result).rejects.toThrowError(
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
      await expect(result).rejects.toThrowError(
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
      await setupEditorPermissions({ userId: session.userId, siteId: site.id })

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
      await setupEditorPermissions({ userId: session.userId, siteId: site.id })

      // Create collections with different titles to test ordering
      const { collection: collection1 } = await setupCollection({
        siteId: site.id,
        title: "Zebra Collection",
        permalink: "zebra-collection",
      })
      const { collection: collection2 } = await setupCollection({
        siteId: site.id,
        title: "Alpha Collection",
        permalink: "alpha-collection",
      })
      const { collection: collection3 } = await setupCollection({
        siteId: site.id,
        title: "Beta Collection",
        permalink: "beta-collection",
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
      await setupEditorPermissions({ userId: session.userId, siteId: site1.id })
      await setupEditorPermissions({ userId: session.userId, siteId: site2.id })

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
      await setupEditorPermissions({ userId: session.userId, siteId: site.id })

      // Create a collection and other resource types
      const { collection } = await setupCollection({
        siteId: site.id,
        title: "Test Collection",
      })
      await setupPageResource({
        siteId: site.id,
        resourceType: "Page",
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
      await setupEditorPermissions({ userId: session.userId, siteId: site.id })

      // Create collections
      const { collection: collectionWithChildren } = await setupCollection({
        siteId: site.id,
        permalink: "collection-with-children",
      })
      const { collection: _emptyCollection } = await setupCollection({
        siteId: site.id,
        permalink: "empty-collection",
      })

      // Add children to the first collection
      await setupPageResource({
        siteId: site.id,
        resourceType: ResourceType.CollectionPage,
        parentId: collectionWithChildren.id,
        permalink: "child-page",
      })

      // Act
      const result = await caller.getCollections({
        siteId: site.id,
        hasChildren: true,
      })

      // Assert
      expect(result).toHaveLength(1)
      expect(result[0]?.id).toBe(collectionWithChildren.id)
    })
  })

  describe("countTagOptionUsage", () => {
    const TAG_OPTION_ID = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"

    async function setupCollectionWithIndexPage() {
      const { collection, site } = await setupCollection()
      const { page: indexPage } = await setupPageResource({
        siteId: site.id,
        resourceType: ResourceType.IndexPage,
        parentId: collection.id,
      })
      return { collection, site, indexPage }
    }

    it("should throw 401 if not logged in", async () => {
      // Arrange
      const { site, indexPage } = await setupCollectionWithIndexPage()
      await setupAdminPermissions({ userId: session.userId, siteId: site.id })

      // Act
      const result = unauthedCaller.countTagOptionUsage({
        siteId: site.id,
        pageId: Number(indexPage.id),
        tagOptionId: TAG_OPTION_ID,
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
      const result = caller.countTagOptionUsage({
        siteId: site.id,
        pageId: Number(indexPage.id),
        tagOptionId: TAG_OPTION_ID,
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

    it("should throw 404 if index page does not exist", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupEditorPermissions({ userId: session.userId, siteId: site.id })

      // Act
      const result = caller.countTagOptionUsage({
        siteId: site.id,
        pageId: 99999,
        tagOptionId: TAG_OPTION_ID,
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({
          code: "NOT_FOUND",
          message: "Collection index page not found",
        }),
      )
    })

    it("should throw 404 if pageId is not a collection index page", async () => {
      // Arrange
      const { site, page } = await setupPageResource({ resourceType: "Page" })
      await setupEditorPermissions({ userId: session.userId, siteId: site.id })

      // Act
      const result = caller.countTagOptionUsage({
        siteId: site.id,
        pageId: Number(page.id),
        tagOptionId: TAG_OPTION_ID,
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
      await setupEditorPermissions({ userId: session.userId, siteId: siteA.id })
      await setupEditorPermissions({ userId: session.userId, siteId: siteB.id })

      // Act
      const result = caller.countTagOptionUsage({
        siteId: siteB.id,
        pageId: Number(indexPage.id),
        tagOptionId: TAG_OPTION_ID,
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({
          code: "NOT_FOUND",
          message: "Collection index page not found",
        }),
      )
    })

    it("should return 0 when there are no child items", async () => {
      // Arrange
      const { site, indexPage } = await setupCollectionWithIndexPage()
      await setupEditorPermissions({ userId: session.userId, siteId: site.id })

      // Act
      const result = await caller.countTagOptionUsage({
        siteId: site.id,
        pageId: Number(indexPage.id),
        tagOptionId: TAG_OPTION_ID,
      })

      // Assert
      expect(result).toEqual({ count: 0 })
    })

    it("should return 0 when no item references the tag option", async () => {
      // Arrange
      const { collection, site, indexPage } =
        await setupCollectionWithIndexPage()
      await setupEditorPermissions({ userId: session.userId, siteId: site.id })
      await setupPageResource({
        siteId: site.id,
        resourceType: ResourceType.CollectionPage,
        parentId: collection.id,
        permalink: "page-a",
      })

      // Act
      const result = await caller.countTagOptionUsage({
        siteId: site.id,
        pageId: Number(indexPage.id),
        tagOptionId: TAG_OPTION_ID,
      })

      // Assert
      expect(result).toEqual({ count: 0 })
    })

    it("should return 1 when a collection page draft blob lists the tag", async () => {
      // Arrange
      const { collection, site, indexPage } =
        await setupCollectionWithIndexPage()
      await setupEditorPermissions({ userId: session.userId, siteId: site.id })
      await setupCollectionPage({
        siteId: site.id,
        parentId: collection.id,
        permalink: "tagged-page",
        tagged: [TAG_OPTION_ID],
      })

      // Act
      const result = await caller.countTagOptionUsage({
        siteId: site.id,
        pageId: Number(indexPage.id),
        tagOptionId: TAG_OPTION_ID,
      })

      // Assert
      expect(result).toEqual({ count: 1 })
    })

    it("should return 1 when only the published blob lists the tag", async () => {
      // Arrange
      const { collection, site, indexPage } =
        await setupCollectionWithIndexPage()
      await setupEditorPermissions({ userId: session.userId, siteId: site.id })
      const { page } = await setupPageResource({
        siteId: site.id,
        resourceType: ResourceType.CollectionPage,
        parentId: collection.id,
        permalink: "pub-only",
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
          versionNum: 1,
          resourceId: page.id,
          blobId: publishedBlob.id,
          publishedBy: session.userId!,
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
      const result = await caller.countTagOptionUsage({
        siteId: site.id,
        pageId: Number(indexPage.id),
        tagOptionId: TAG_OPTION_ID,
      })

      // Assert
      expect(result).toEqual({ count: 1 })
    })

    it("should count a resource once when both draft and published list the tag", async () => {
      // Arrange
      const { collection, site, indexPage } =
        await setupCollectionWithIndexPage()
      await setupEditorPermissions({ userId: session.userId, siteId: site.id })
      const { page } = await setupPageResource({
        siteId: site.id,
        resourceType: ResourceType.CollectionPage,
        parentId: collection.id,
        permalink: "both-blobs",
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
          versionNum: 1,
          resourceId: page.id,
          blobId: publishedBlob.id,
          publishedBy: session.userId!,
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
      const result = await caller.countTagOptionUsage({
        siteId: site.id,
        pageId: Number(indexPage.id),
        tagOptionId: TAG_OPTION_ID,
      })

      // Assert
      expect(result).toEqual({ count: 1 })
    })

    it("should return 2 when two child items reference the tag", async () => {
      // Arrange
      const { collection, site, indexPage } =
        await setupCollectionWithIndexPage()
      await setupEditorPermissions({ userId: session.userId, siteId: site.id })
      const { blob: blobA } = await setupPageResource({
        siteId: site.id,
        resourceType: ResourceType.CollectionPage,
        parentId: collection.id,
        permalink: "page-1",
      })
      const { blob: blobB } = await setupPageResource({
        siteId: site.id,
        resourceType: ResourceType.CollectionLink,
        parentId: collection.id,
        permalink: "page-2",
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
      const result = await caller.countTagOptionUsage({
        siteId: site.id,
        pageId: Number(indexPage.id),
        tagOptionId: TAG_OPTION_ID,
      })

      // Assert
      expect(result).toEqual({ count: 2 })
    })
  })

  describe("countTagCategoryUsage", () => {
    const FILTER_ID = "c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"
    const TAG_OPTION_A = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"
    const TAG_OPTION_B = "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12"

    async function setupCollectionWithIndexPage() {
      const { collection, site } = await setupCollection()
      const { page: indexPage, blob: indexBlob } = await setupPageResource({
        siteId: site.id,
        resourceType: ResourceType.IndexPage,
        parentId: collection.id,
      })
      return { collection, site, indexPage, indexBlob }
    }

    async function seedIndexPageTagCategories(
      indexBlobId: string,
      tagCategories: NonNullable<CollectionPagePageProps["tagCategories"]>,
    ) {
      const base = createCollectionIndexJson("Test collection")
      await db
        .updateTable("Blob")
        .set({
          content: jsonb({
            ...base,
            page: { ...base.page, tagCategories },
          }),
        })
        .where("id", "=", indexBlobId)
        .execute()
    }

    it("should return 0 when the filter id is not on the index page", async () => {
      // Arrange
      const { site, indexPage } = await setupCollectionWithIndexPage()
      await setupEditorPermissions({ userId: session.userId, siteId: site.id })

      // Act
      const result = await caller.countTagCategoryUsage({
        siteId: site.id,
        pageId: Number(indexPage.id),
        tagCategory: { label: "Missing", id: FILTER_ID },
      })

      // Assert
      expect(result).toEqual({ count: 0 })
    })

    it("should throw 404 if index page does not exist", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupEditorPermissions({ userId: session.userId, siteId: site.id })

      // Act
      const result = caller.countTagCategoryUsage({
        siteId: site.id,
        pageId: 99999,
        tagCategory: { label: "F", id: TAG_OPTION_A },
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({
          code: "NOT_FOUND",
          message: "Collection index page not found",
        }),
      )
    })

    it("should return 1 when a child item lists one of the filter's options", async () => {
      // Arrange
      const { collection, site, indexPage, indexBlob } =
        await setupCollectionWithIndexPage()
      await setupEditorPermissions({ userId: session.userId, siteId: site.id })
      await seedIndexPageTagCategories(indexBlob.id, [
        {
          id: FILTER_ID,
          label: "Filter",
          options: [
            { id: TAG_OPTION_A, label: "A" },
            { id: TAG_OPTION_B, label: "B" },
          ],
        },
      ])
      await setupCollectionPage({
        siteId: site.id,
        parentId: collection.id,
        permalink: "tagged-page",
        tagged: [TAG_OPTION_A],
      })

      // Act
      const result = await caller.countTagCategoryUsage({
        siteId: site.id,
        pageId: Number(indexPage.id),
        tagCategory: { label: "Filter", id: FILTER_ID },
      })

      // Assert
      expect(result).toEqual({ count: 1 })
    })

    it("should count a resource once when tagged lists multiple options from the filter", async () => {
      // Arrange
      const { collection, site, indexPage, indexBlob } =
        await setupCollectionWithIndexPage()
      await setupEditorPermissions({ userId: session.userId, siteId: site.id })
      await seedIndexPageTagCategories(indexBlob.id, [
        {
          id: FILTER_ID,
          label: "Filter",
          options: [
            { id: TAG_OPTION_A, label: "A" },
            { id: TAG_OPTION_B, label: "B" },
          ],
        },
      ])
      await setupCollectionPage({
        siteId: site.id,
        parentId: collection.id,
        permalink: "multi-tag-page",
        tagged: [TAG_OPTION_A, TAG_OPTION_B],
      })

      // Act
      const result = await caller.countTagCategoryUsage({
        siteId: site.id,
        pageId: Number(indexPage.id),
        tagCategory: { label: "Filter", id: FILTER_ID },
      })

      // Assert
      expect(result).toEqual({ count: 1 })
    })
  })
})
