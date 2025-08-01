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
  setupEditorPermissions,
  setupFolder,
  setupPageResource,
  setupSite,
  setupUser,
} from "tests/integration/helpers/seed"

import { createCallerFactory } from "~/server/trpc"
import { AuditLogEvent, db, ResourceState, ResourceType } from "../../database"
import { folderRouter } from "../folder.router"

const createCaller = createCallerFactory(folderRouter)

describe("folder.router", async () => {
  let caller: ReturnType<typeof createCaller>
  let unauthedCaller: ReturnType<typeof createCaller>
  const session = await applyAuthedSession()

  beforeEach(async () => {
    await resetTables(
      "AuditLog",
      "Blob",
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
        folderTitle: "test folder",
        siteId: 1,
        permalink: "test-folder",
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
      await expect(
        db.selectFrom("AuditLog").selectAll().execute(),
      ).resolves.toHaveLength(0)
    })

    it("should throw 409 if permalink already exists", async () => {
      // Arrange
      const duplicatePermalink = "duplicate-permalink"
      const { site } = await setupFolder({ permalink: duplicatePermalink })
      await setupAdminPermissions({
        userId: session.userId,
        siteId: site.id,
      })

      // Act
      const result = caller.create({
        folderTitle: "test folder",
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
      await expect(
        db.selectFrom("AuditLog").selectAll().execute(),
      ).resolves.toHaveLength(0)
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
        folderTitle: "test folder",
        siteId: invalidSiteId,
        permalink: "test-folder",
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

    it("should throw 404 if `parentFolderId` does not exist", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupAdminPermissions({
        userId: session.userId,
        siteId: site.id,
      })

      // Act
      const result = caller.create({
        folderTitle: "test folder",
        siteId: site.id,
        permalink: "test-folder",
        parentFolderId: 999,
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({
          code: "NOT_FOUND",
          message: "Parent folder does not exist",
        }),
      )
      await expect(
        db.selectFrom("AuditLog").selectAll().execute(),
      ).resolves.toHaveLength(0)
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
        folderTitle: "test folder",
        siteId: site.id,
        permalink: "test-folder",
        parentFolderId: Number(page.id),
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({
          code: "BAD_REQUEST",
          message: "Resource ID does not point to a folder",
        }),
      )
      await expect(
        db.selectFrom("AuditLog").selectAll().execute(),
      ).resolves.toHaveLength(0)
    })

    it("should create a folder even with duplicate permalink if `siteId` is different", async () => {
      // Arrange
      const duplicatePermalink = "duplicate-permalink"
      const { site: _firstSite } = await setupFolder({
        permalink: duplicatePermalink,
      })
      const { site: secondSite } = await setupSite()
      await setupAdminPermissions({
        userId: session.userId,
        siteId: secondSite.id,
      })

      // Act
      const result = await caller.create({
        folderTitle: "test folder",
        siteId: secondSite.id,
        permalink: duplicatePermalink,
      })

      // Assert
      const actualFolder = await getFolderWithPermalink({
        siteId: secondSite.id,
        permalink: duplicatePermalink,
      })
      expect(result).toEqual({ folderId: actualFolder.id })
      const auditLogs = await db
        .selectFrom("AuditLog")
        .selectAll()
        .executeTakeFirst()
      expect(auditLogs).toBeDefined()
      expect(auditLogs?.userId).toEqual(session.userId)
      expect(auditLogs?.eventType).toEqual(AuditLogEvent.ResourceCreate)
    })

    it("should create a folder", async () => {
      // Arrange
      const permalinkToUse = "test-folder-999"
      const { site } = await setupSite()
      await setupAdminPermissions({
        userId: session.userId,
        siteId: site.id,
      })

      // Act
      const result = await caller.create({
        folderTitle: "test folder 999",
        siteId: site.id,
        permalink: permalinkToUse,
      })

      // Assert
      const actualFolder = await getFolderWithPermalink({
        permalink: permalinkToUse,
        siteId: site.id,
      })
      expect(result).toEqual({ folderId: actualFolder.id })
      const auditLogs = await db
        .selectFrom("AuditLog")
        .selectAll()
        .executeTakeFirst()
      expect(auditLogs).toBeDefined()
      expect(auditLogs?.userId).toEqual(session.userId)
      expect(auditLogs?.eventType).toEqual(AuditLogEvent.ResourceCreate)
    })

    it("should create a nested folder if `parentFolderId` is provided", async () => {
      // Arrange
      const permalinkToUse = "test-folder-777"
      const { folder: parentFolder, site } = await setupFolder()
      await setupAdminPermissions({
        userId: session.userId,
        siteId: site.id,
      })

      // Act
      const result = await caller.create({
        folderTitle: "test folder",
        siteId: site.id,
        permalink: permalinkToUse,
        parentFolderId: Number(parentFolder.id),
      })

      // Assert
      const actualFolder = await getFolderWithPermalink({
        permalink: permalinkToUse,
        siteId: site.id,
      })
      expect(actualFolder.parentId).toEqual(parentFolder.id)
      expect(result).toEqual({ folderId: actualFolder.id })
      const auditLogs = await db
        .selectFrom("AuditLog")
        .selectAll()
        .executeTakeFirst()
      expect(auditLogs).toBeDefined()
      expect(auditLogs?.userId).toEqual(session.userId)
      expect(auditLogs?.eventType).toEqual(AuditLogEvent.ResourceCreate)
    })

    it("should throw 403 if user does not have admin access to the site and tries to create a root level folder", async () => {
      // Arrange
      const permalinkToUse = "test-folder-777"
      const { site } = await setupSite()
      await setupEditorPermissions({ userId: session.userId, siteId: site.id })

      // Act
      const result = caller.create({
        folderTitle: "test folder",
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
      await expect(
        db.selectFrom("AuditLog").selectAll().execute(),
      ).resolves.toHaveLength(0)
    })

    it("should throw 403 if user does not have access to the site", async () => {
      // Arrange
      const permalinkToUse = "test-folder-777"
      const { folder: parentFolder, site } = await setupFolder()

      // Act
      const result = caller.create({
        folderTitle: "test folder",
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
      await expect(
        db.selectFrom("AuditLog").selectAll().execute(),
      ).resolves.toHaveLength(0)
    })

    it.skip("should throw 403 if user does not have write access to the parent folder", async () => {})
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

    it("should throw 404 if `folderId` does not exist", async () => {
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
          message: "This folder does not exist",
        }),
      )
    })

    it("should throw 403 if user does not have read access to the site", async () => {
      // Arrange
      const { folder, site } = await setupFolder()

      // Act
      const result = caller.getMetadata({
        siteId: site.id,
        resourceId: Number(folder.id),
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

    it("should return 200 if the folder exists", async () => {
      // Arrange
      const { folder, site } = await setupFolder()
      await setupAdminPermissions({ userId: session.userId, siteId: site.id })

      // Act
      const result = await caller.getMetadata({
        siteId: site.id,
        resourceId: Number(folder.id),
      })

      // Assert
      const expected = await db
        .selectFrom("Resource")
        .select(["Resource.title", "Resource.permalink", "Resource.parentId"])
        .where("id", "=", folder.id)
        .executeTakeFirst()
      expect(result).toEqual(expected)
    })
  })

  describe("editFolder", () => {
    it("should throw 401 if not logged in", async () => {
      // Act
      const { folder, site } = await setupFolder()
      const result = unauthedCaller.editFolder({
        siteId: String(site.id),
        resourceId: folder.id,
        title: "fake",
        permalink: "news",
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
      await expect(
        db.selectFrom("AuditLog").selectAll().execute(),
      ).resolves.toHaveLength(0)
    })

    it("should throw 409 if permalink already exists", async () => {
      // Arrange
      const duplicatePermalink = "duplicate-permalink"
      const { site } = await setupFolder({
        permalink: duplicatePermalink,
      })
      const { folder } = await setupFolder({ siteId: site.id })
      await setupAdminPermissions({
        userId: session.userId,
        siteId: site.id,
      })

      // Act
      const result = caller.editFolder({
        title: "test folder",
        siteId: String(site.id),
        permalink: duplicatePermalink,
        resourceId: folder.id,
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({
          code: "CONFLICT",
          message: "A resource with the same permalink already exists",
        }),
      )
      await expect(
        db.selectFrom("AuditLog").selectAll().execute(),
      ).resolves.toHaveLength(0)
    })

    it("should allow duplicate permalinks if the site is different", async () => {
      // Arrange
      const duplicatePermalink = "duplicate-permalink"
      await setupFolder({
        permalink: duplicatePermalink,
      })
      const { folder, site } = await setupFolder()
      await setupAdminPermissions({
        userId: session.userId,
        siteId: site.id,
      })

      // Act
      const result = await caller.editFolder({
        title: "test folder",
        siteId: String(site.id),
        permalink: duplicatePermalink,
        resourceId: folder.id,
      })
      const expected = { permalink: duplicatePermalink, siteId: site.id }

      // Assert
      expect(result).toMatchObject(expected)
      const auditLogs = await db
        .selectFrom("AuditLog")
        .selectAll()
        .executeTakeFirst()
      expect(auditLogs).toBeDefined()
      expect(auditLogs?.userId).toEqual(session.userId)
      expect(auditLogs?.eventType).toEqual(AuditLogEvent.ResourceUpdate)
    })

    it("should throw 404 if `siteId` does not exist", async () => {
      // Arrange
      const invalidSiteId = 999
      const { site, folder } = await setupFolder()
      await setupAdminPermissions({
        userId: session.userId,
        siteId: site.id,
      })
      expect(site.id).not.toEqual(invalidSiteId)

      // Act
      const result = caller.editFolder({
        siteId: String(invalidSiteId),
        permalink: "test-folder",
        title: "fake",
        resourceId: folder.id,
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({
          code: "NOT_FOUND",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )
      await expect(
        db.selectFrom("AuditLog").selectAll().execute(),
      ).resolves.toHaveLength(0)
    })

    it("should allow edits onto a folder regardless of the parent", async () => {
      // Arrange
      const { site, folder } = await setupFolder()
      const { page } = await setupPageResource({
        siteId: site.id,
        resourceType: "Page",
      })
      await setupAdminPermissions({
        userId: session.userId,
        siteId: site.id,
      })
      await db.updateTable("Resource").set({ parentId: page.id }).execute()
      const permalink = "tempora-link"

      // Act
      const result = await caller.editFolder({
        siteId: String(site.id),
        permalink,
        resourceId: folder.id,
        title: folder.title,
      })

      // Assert
      const expected = await getFolderWithPermalink({
        permalink,
        siteId: site.id,
      })
      expect(result).toMatchObject({
        id: expected.id,
        title: expected.title,
        permalink: expected.permalink,
        parentId: page.id,
      })
      const auditLogs = await db
        .selectFrom("AuditLog")
        .selectAll()
        .executeTakeFirst()
      expect(auditLogs).toBeDefined()
      expect(auditLogs?.userId).toEqual(session.userId)
      expect(auditLogs?.eventType).toEqual(AuditLogEvent.ResourceUpdate)
    })

    it("should throw 403 if user does not have access to the site", async () => {
      // Arrange
      const permalink = "test-folder-777"
      const { site, folder } = await setupFolder()

      // Act
      const result = caller.editFolder({
        siteId: String(site.id),
        permalink,
        resourceId: folder.id,
        title: folder.title,
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({
          code: "NOT_FOUND",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )
      await expect(
        db.selectFrom("AuditLog").selectAll().execute(),
      ).resolves.toHaveLength(0)
    })

    it("should throw 404 if the resourceId is not a folder", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupAdminPermissions({ siteId: site.id, userId: session.userId })
      const { page } = await setupPageResource({ resourceType: "Page" })

      // Act
      const result = caller.editFolder({
        siteId: String(site.id),
        resourceId: page.id,
        title: "fake",
        permalink: "news",
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({
          code: "NOT_FOUND",
          message: "Resource does not exist",
        }),
      )
      await expect(
        db.selectFrom("AuditLog").selectAll().execute(),
      ).resolves.toHaveLength(0)
    })

    it("should throw 404 if the resourceId does not exist", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupAdminPermissions({ siteId: site.id, userId: session.userId })

      // Act
      const result = caller.editFolder({
        siteId: String(site.id),
        resourceId: "0",
        title: "fake",
        permalink: "news",
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({
          code: "NOT_FOUND",
          message: "Resource does not exist",
        }),
      )
      await expect(
        db.selectFrom("AuditLog").selectAll().execute(),
      ).resolves.toHaveLength(0)
    })

    it("should allow edits on a root level folder regardless of the role", async () => {
      // Arrange
      const permalink = "test-folder-777"
      const { site, folder } = await setupFolder()
      await setupEditorPermissions({ userId: session.userId, siteId: site.id })

      // Act
      const result = await caller.editFolder({
        siteId: String(site.id),
        permalink,
        resourceId: folder.id,
        title: folder.title,
      })

      // Assert
      const expected = await getFolderWithPermalink({
        siteId: site.id,
        permalink,
      })
      expect(result).toMatchObject({
        permalink: expected.permalink,
        id: expected.id,
      })
      const auditLogs = await db
        .selectFrom("AuditLog")
        .selectAll()
        .executeTakeFirst()
      expect(auditLogs).toBeDefined()
      expect(auditLogs?.userId).toEqual(session.userId)
      expect(auditLogs?.eventType).toEqual(AuditLogEvent.ResourceUpdate)
    })

    it("should allow edits on a nested folder regardless of the role", async () => {
      // Arrange
      const permalink = "test-folder-777"
      const { site, folder: parentFolder } = await setupFolder()
      const { folder } = await setupFolder({
        siteId: site.id,
        parentId: parentFolder.id,
      })
      await setupEditorPermissions({ userId: session.userId, siteId: site.id })

      // Act
      const result = await caller.editFolder({
        siteId: String(site.id),
        permalink,
        resourceId: folder.id,
        title: folder.title,
      })

      // Assert
      const expected = await getFolderWithPermalink({
        siteId: site.id,
        permalink,
      })
      expect(result).toMatchObject({
        permalink: expected.permalink,
        id: expected.id,
      })
      const auditLogs = await db
        .selectFrom("AuditLog")
        .selectAll()
        .executeTakeFirst()
      expect(auditLogs).toBeDefined()
      expect(auditLogs?.userId).toEqual(session.userId)
      expect(auditLogs?.eventType).toEqual(AuditLogEvent.ResourceUpdate)
    })
  })

  describe("getIndexpage", () => {
    it("should throw 401 if not logged in", async () => {
      // Act
      const result = unauthedCaller.getIndexpage({
        siteId: 1,
        resourceId: "1",
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should throw 403 if user does not have read access to the site", async () => {
      // Arrange
      const { folder, site } = await setupFolder()
      await setupPageResource({
        resourceType: ResourceType.IndexPage,
        siteId: site.id,
        parentId: folder.id,
      })

      // Act
      const result = caller.getIndexpage({
        siteId: site.id,
        resourceId: folder.id,
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
      const { folder, site } = await setupFolder()
      const { page, blob } = await setupPageResource({
        resourceType: ResourceType.IndexPage,
        siteId: site.id,
        parentId: folder.id,
      })
      await setupEditorPermissions({ userId: session.userId, siteId: site.id })

      // Act
      const result = await caller.getIndexpage({
        siteId: site.id,
        resourceId: folder.id,
      })

      // Assert
      expect(result).toEqual({
        title: folder.title,
        id: page.id,
        draftBlobId: blob.id,
      })
      await expect(
        db.selectFrom("AuditLog").selectAll().execute(),
      ).resolves.toHaveLength(0)
    })
  })

  describe("listChildPages", () => {
    it("should throw 401 if not logged in", async () => {
      // Arrange
      const { folder, site } = await setupFolder()
      const { page: indexPage } = await setupPageResource({
        parentId: folder.id,
        siteId: site.id,
        resourceType: "IndexPage",
      })
      await createChildPages({
        parentId: folder.id,
        siteId: site.id,
        numPages: 3,
        numFolders: 5,
      })

      // Act
      const result = unauthedCaller.listChildPages({
        siteId: String(site.id),
        indexPageId: indexPage.id,
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should return an empty array if `siteId` does not exist", async () => {
      // Arrange
      const invalidSiteId = 999
      const { site, folder } = await setupFolder()
      await setupEditorPermissions({
        userId: session.userId,
        siteId: site.id,
      })
      expect(site.id).not.toEqual(invalidSiteId)
      const { page: indexPage } = await setupPageResource({
        parentId: folder.id,
        siteId: site.id,
        resourceType: "IndexPage",
      })
      await createChildPages({
        parentId: folder.id,
        siteId: site.id,
        numPages: 3,
        numFolders: 5,
      })

      // Act
      const result = await caller.listChildPages({
        siteId: String(site.id),
        indexPageId: indexPage.id,
      })

      // Assert
      expect(result.childPages).toEqual([])
    })

    it("should throw 403 if user does not have access to the site", async () => {
      // Arrange
      const { site, folder } = await setupFolder()
      const { page: indexPage } = await setupPageResource({
        parentId: folder.id,
        siteId: site.id,
        resourceType: "IndexPage",
      })

      // Act
      const result = caller.listChildPages({
        siteId: String(site.id),
        indexPageId: indexPage.id,
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

    it("should throw 404 if the page specified by `indexPageId` is not an `IndexPage`", async () => {
      // Arrange
      const { site, folder } = await setupFolder()
      await setupEditorPermissions({ siteId: site.id, userId: session.userId })
      const { page } = await setupPageResource({
        siteId: site.id,
        resourceType: "Page",
        parentId: folder.id,
      })

      // Act
      const result = caller.listChildPages({
        siteId: String(site.id),
        indexPageId: page.id,
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({
          code: "NOT_FOUND",
          message: "No index page with the specified id could be found",
        }),
      )
      await expect(
        db.selectFrom("AuditLog").selectAll().execute(),
      ).resolves.toHaveLength(0)
    })

    it("should throw 404 if the `indexPageId` does not exist", async () => {
      // Arrange
      const { site } = await setupFolder()
      await setupEditorPermissions({ siteId: site.id, userId: session.userId })

      // Act
      const result = caller.listChildPages({
        siteId: String(site.id),
        indexPageId: "1234",
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({
          code: "NOT_FOUND",
          message: "Resource not found",
        }),
      )
      await expect(
        db.selectFrom("AuditLog").selectAll().execute(),
      ).resolves.toHaveLength(0)
    })

    it("should return only the published pages of the parent folder", async () => {
      // Arrange
      const { site, folder } = await setupFolder()
      await setupEditorPermissions({ siteId: site.id, userId: session.userId })
      const { page: indexPage } = await setupPageResource({
        parentId: folder.id,
        siteId: site.id,
        resourceType: "IndexPage",
      })
      const { pages, folders } = await createChildPages({
        parentId: folder.id,
        siteId: site.id,
        numPages: 3,
        numFolders: 4,
        state: "Published",
        userId: session.userId,
      })

      // NOTE: Not `published`
      await createChildPages({
        parentId: folder.id,
        siteId: site.id,
        numPages: 3,
        numFolders: 4,
      })

      // Act
      const result = await caller.listChildPages({
        siteId: String(site.id),
        indexPageId: indexPage.id,
      })

      // Assert
      expect(result.childPages).toHaveLength(7)
      const folderPagesId = folders.map(({ id }) => id)
      const pagesId = pages.map(({ id }) => id)
      expect(result.childPages.map(({ id }) => id).toSorted()).toStrictEqual(
        [...pagesId, ...folderPagesId].toSorted(),
      )
    })
  })
})

// Test util functions
const getFolderWithPermalink = ({
  siteId,
  permalink,
}: {
  siteId: number
  permalink: string
}) => {
  return db
    .selectFrom("Resource")
    .where("type", "=", ResourceType.Folder)
    .where("siteId", "=", siteId)
    .where("permalink", "=", permalink)
    .selectAll()
    .executeTakeFirstOrThrow()
}

const createChildPages = async ({
  parentId,
  siteId,
  numPages,
  numFolders,
  state = ResourceState.Draft,
  userId,
}: {
  parentId: string
  siteId: number
  numPages: number
  numFolders: number
  state?: ResourceState
  userId?: string
}) => {
  if (state === ResourceState.Published && !userId) {
    throw new Error(
      "Precondition failed for `createChildPages`: a valid `userId` is required in order to publish a resource",
    )
  }

  const pages = await Promise.all(
    Array.from({ length: numPages })
      .fill(null)
      .map(async () => {
        const permalink = crypto.randomUUID()
        const { page } = await setupPageResource({
          resourceType: "Page",
          siteId,
          parentId,
          state,
          permalink,
          userId,
        })
        return page
      }),
  )

  const folders = await Promise.all(
    Array.from({ length: numFolders })
      .fill(null)
      .map(async () => {
        const { folder } = await setupFolder({
          siteId,
          parentId,
          permalink: crypto.randomUUID(),
          state: ResourceState.Published,
        })

        const permalink = crypto.randomUUID()
        await setupPageResource({
          resourceType: "IndexPage",
          siteId,
          parentId: folder.id,
          state,
          permalink,
          userId,
        })

        return folder
      }),
  )

  return { pages, folders }
}
