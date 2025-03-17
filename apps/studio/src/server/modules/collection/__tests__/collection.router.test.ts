import { TRPCError } from "@trpc/server"
import _ from "lodash"
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
  setupEditorPermissions,
  setupFolder,
  setupPageResource,
  setupSite,
  setupUser,
} from "tests/integration/helpers/seed"

import * as auditService from "~/server/modules/audit/audit.service"
import { createCallerFactory } from "~/server/trpc"
import { db, ResourceType } from "../../database"
import { getBlobOfResource } from "../../resource/resource.service"
import { collectionRouter } from "../collection.router"

const createCaller = createCallerFactory(collectionRouter)

describe("collection.router", async () => {
  let caller: ReturnType<typeof createCaller>
  let unauthedCaller: ReturnType<typeof createCaller>
  const session = await applyAuthedSession()

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
  })

  describe("create", () => {
    it("should throw 401 if not logged in", async () => {
      // Act
      const result = unauthedCaller.create({
        collectionTitle: "test collection",
        siteId: 1,
        permalink: "test-collection",
      })
      const auditSpy = vitest.spyOn(auditService, "logResourceEvent")

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
      expect(auditSpy).not.toHaveBeenCalled()
    })

    it("should throw 409 if permalink already exists", async () => {
      // Arrange
      const duplicatePermalink = "duplicate-permalink"
      const { site } = await setupCollection({ permalink: duplicatePermalink })
      await setupAdminPermissions({
        userId: session.userId,
        siteId: site.id,
      })
      const auditSpy = vitest.spyOn(auditService, "logResourceEvent")

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
      const auditSpy = vitest.spyOn(auditService, "logResourceEvent")

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
    })

    it("should throw 404 if `parentFolderId` does not exist", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupAdminPermissions({
        userId: session.userId,
        siteId: site.id,
      })
      const auditSpy = vitest.spyOn(auditService, "logResourceEvent")

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
      const auditSpy = vitest.spyOn(auditService, "logResourceEvent")

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
      const auditSpy = vitest.spyOn(auditService, "logResourceEvent")

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
      const auditEntry = await db
        .selectFrom("AuditLog")
        .where("eventType", "=", "ResourceCreate")
        .selectAll()
        .executeTakeFirstOrThrow()
      expect(auditEntry.delta.after!).toMatchObject({ id: result.id })
      expect(auditEntry.userId).toBe(session.userId)
    })

    it("should create a collection", async () => {
      // Arrange
      const permalinkToUse = "test-collection-999"
      const { site } = await setupSite()
      const auditSpy = vitest.spyOn(auditService, "logResourceEvent")
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
      const auditEntry = await db
        .selectFrom("AuditLog")
        .where("eventType", "=", "ResourceCreate")
        .selectAll()
        .executeTakeFirstOrThrow()
      expect(auditEntry.delta.after!).toMatchObject({ id: result.id })
      expect(auditEntry.userId).toBe(session.userId)
    })

    it("should create a nested collection if `parentFolderId` is provided", async () => {
      // Arrange
      const permalinkToUse = "test-collection-777"
      const { folder: parent, site } = await setupFolder()
      await setupAdminPermissions({
        userId: session.userId,
        siteId: site.id,
      })
      const auditSpy = vitest.spyOn(auditService, "logResourceEvent")

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
      expect(auditSpy).toHaveBeenCalled()
      const auditEntry = await db
        .selectFrom("AuditLog")
        .where("eventType", "=", "ResourceCreate")
        .selectAll()
        .executeTakeFirstOrThrow()
      expect(auditEntry.delta.after!).toMatchObject({ id: result.id })
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
      const auditSpy = vitest.spyOn(auditService, "logResourceEvent")

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
      expect(auditSpy).not.toHaveBeenCalled()
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
      // NOTE: first call, now there's an existing page with `duplicatePermalink`
      await caller.createCollectionPage({
        title: "test folder",
        type: "CollectionPage",
        siteId: site.id,
        collectionId: Number(collection.id),
        permalink: duplicatePermalink,
      })
      const auditSpy = vitest.spyOn(auditService, "logResourceEvent")

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
      const auditSpy = vitest.spyOn(auditService, "logResourceEvent")

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
    })

    it("should throw 404 if `collectionId` does not exist", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupAdminPermissions({
        userId: session.userId,
        siteId: site.id,
      })
      const auditSpy = vitest.spyOn(auditService, "logResourceEvent")

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
      const auditSpy = vitest.spyOn(auditService, "logResourceEvent")

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
    })

    it("should create a collection page even with duplicate permalink if `siteId` is different", async () => {
      // Arrange
      const duplicatePermalink = "duplicate-permalink"
      const { site, collection } = await setupCollection({
        permalink: duplicatePermalink,
      })
      // NOTE: order matters here - this spy must be setup before
      // the first call out to `createCollectionPage`
      const auditSpy = vitest.spyOn(auditService, "logResourceEvent")
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
      await caller.createCollectionPage({
        title: "test collection",
        type: "CollectionPage",
        siteId: secondSite.id,
        collectionId: Number(secondCollection.id),
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
      expect(auditSpy).toHaveBeenCalledTimes(2)
      const auditEntry = await db
        .selectFrom("AuditLog")
        .where("eventType", "=", "ResourceCreate")
        .orderBy("AuditLog.createdAt desc")
        .selectAll()
        .execute()
      // NOTE: 2 pages created via the router method - expect 2 entries in our audit logs
      expect(auditEntry).toHaveLength(2)
      expect(auditEntry[0]).toBeDefined()
      expect(auditEntry[0]!.delta.after!).toMatchObject({
        resource: { id: result.pageId },
      })
    })

    it("should create a collection page", async () => {
      // Arrange
      const permalink = "test-collection-999"
      const { collection, site } = await setupCollection()
      const auditSpy = vitest.spyOn(auditService, "logResourceEvent")
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
    })

    it.skip("should throw 403 if user does not have write access to the parent collection", async () => {})
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

    it("should return 200 ", async () => {
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

  describe("updateCollectionLink", () => {
    it("should fail to update a non-existent `linkId`", async () => {
      const { site } = await setupCollection()
      await setupAdminPermissions({ userId: session.userId, siteId: site.id })
      const auditSpy = vitest.spyOn(auditService, "logResourceEvent")

      const expected = caller.updateCollectionLink({
        siteId: site.id,
        category: "category",
        ref: "1",
        linkId: 999,
      })

      await expect(expected).rejects.toThrowError(
        new TRPCError({
          code: "NOT_FOUND",
          message: "Unable to find the requested collection link",
        }),
      )
      expect(auditSpy).not.toHaveBeenCalled()
    })
    it("should fail to update if the resource type is not a `CollectionLink`", async () => {
      const { site, collection } = await setupCollection()
      await setupAdminPermissions({ userId: session.userId, siteId: site.id })
      const auditSpy = vitest.spyOn(auditService, "logResourceEvent")

      const expected = caller.updateCollectionLink({
        siteId: site.id,
        category: "category",
        ref: "1",
        linkId: Number(collection.id),
      })

      await expect(expected).rejects.toThrowError(
        new TRPCError({
          code: "NOT_FOUND",
          message: "Unable to find the requested collection link",
        }),
      )
      expect(auditSpy).not.toHaveBeenCalled()
    })
    it("should fail to update if the site does not exist", async () => {
      const { page } = await setupPageResource({
        resourceType: "CollectionLink",
      })
      const auditSpy = vitest.spyOn(auditService, "logResourceEvent")

      const expected = caller.updateCollectionLink({
        siteId: 999,
        category: "category",
        ref: "1",
        linkId: Number(page.id),
      })

      await expect(expected).rejects.toThrowError(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )
      expect(auditSpy).not.toHaveBeenCalled()
    })
    it("should fail to update if the user does not have `update` permissions", async () => {
      const { page, site } = await setupPageResource({
        resourceType: "CollectionLink",
      })
      const auditSpy = vitest.spyOn(auditService, "logResourceEvent")

      const expected = caller.updateCollectionLink({
        siteId: site.id,
        category: "category",
        ref: "1",
        linkId: Number(page.id),
      })

      await expect(expected).rejects.toThrowError(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )
      expect(auditSpy).not.toHaveBeenCalled()
    })
    it("should create a new `draftBlob` if it is currently `null`", async () => {
      const { page, site } = await setupPageResource({
        resourceType: "CollectionLink",
        state: "Published",
        userId: session.userId,
      })
      await setupAdminPermissions({ userId: session.userId, siteId: site.id })
      const auditSpy = vitest.spyOn(auditService, "logResourceEvent")
      expect(page.draftBlobId).toBe(null)
      const originalBlob = await db
        .transaction()
        .execute((tx) => getBlobOfResource(tx, page.id))

      const expected = await caller.updateCollectionLink({
        siteId: site.id,
        category: "category",
        ref: "1",
        linkId: Number(page.id),
      })

      expect(auditSpy).toHaveBeenCalled()
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
      const { page, site } = await setupPageResource({
        resourceType: "CollectionLink",
      })
      const originalBlob = await db
        .transaction()
        .execute((tx) => getBlobOfResource(tx, page.id))
      await setupAdminPermissions({ userId: session.userId, siteId: site.id })
      const auditSpy = vitest.spyOn(auditService, "logResourceEvent")

      const expected = await caller.updateCollectionLink({
        siteId: site.id,
        category: "category",
        ref: "1",
        linkId: Number(page.id),
      })

      expect(auditSpy).toHaveBeenCalled()
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
    it.skip("should fail to update to a deleted `ref`")
    it.skip("should fail to update to an invalid `ref`")
  })
})

// Test util functions
const getCollectionWithPermalink = ({
  siteId,
  permalink,
}: {
  siteId: number
  permalink: string
}) => {
  return db
    .selectFrom("Resource")
    .where("type", "=", ResourceType.Collection)
    .where("siteId", "=", siteId)
    .where("permalink", "=", permalink)
    .selectAll()
    .executeTakeFirstOrThrow()
}

const getCollectionItemByPermalink = (
  permalink: string,
  parentId?: string | null,
) => {
  if (parentId) {
    return db
      .selectFrom("Resource")
      .where("parentId", "=", parentId)
      .where("permalink", "=", permalink)
      .selectAll()
      .executeTakeFirstOrThrow()
  }

  return db
    .selectFrom("Resource")
    .where("parentId", "is", null)
    .where("permalink", "=", permalink)
    .selectAll()
    .executeTakeFirstOrThrow()
}
