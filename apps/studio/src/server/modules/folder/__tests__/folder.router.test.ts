/* oxlint-disable typescript/strict-boolean-expressions -- server lint cleanup */
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
import { getReferenceLink } from "~/utils/link"
import { hasNonEmptyString } from "~/utils/truthiness"

import { db } from "../../database/database"
import {
  AuditLogEvent,
  ResourceState,
  ResourceType,
} from "../../database/types"
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
      email: "test@mock.com",
      isDeleted: false,
      userId: session.userId,
    })
    await auth(user)
  })

  describe("create", () => {
    it("should throw 401 if not logged in", async () => {
      // Act
      const result = unauthedCaller.create({
        folderTitle: "test folder",
        permalink: "test-folder",
        siteId: 1,
      })

      // Assert
      await expect(result).rejects.toThrow(
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
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = caller.create({
        folderTitle: "test folder",
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
      await expect(
        db.selectFrom("AuditLog").selectAll().execute(),
      ).resolves.toHaveLength(0)
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
        folderTitle: "test folder",
        permalink: "test-folder",
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

    it("should throw 404 if `parentFolderId` does not exist", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = caller.create({
        folderTitle: "test folder",
        parentFolderId: 999,
        permalink: "test-folder",
        siteId: site.id,
      })

      // Assert
      await expect(result).rejects.toThrow(
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
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = caller.create({
        folderTitle: "test folder",
        parentFolderId: Number(page.id),
        permalink: "test-folder",
        siteId: site.id,
      })

      // Assert
      await expect(result).rejects.toThrow(
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
        siteId: secondSite.id,
        userId: session.userId,
      })

      // Act
      const result = await caller.create({
        folderTitle: "test folder",
        permalink: duplicatePermalink,
        siteId: secondSite.id,
      })

      // Assert
      const actualFolder = await getFolderWithPermalink({
        permalink: duplicatePermalink,
        siteId: secondSite.id,
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
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = await caller.create({
        folderTitle: "test folder 999",
        permalink: permalinkToUse,
        siteId: site.id,
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
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = await caller.create({
        folderTitle: "test folder",
        parentFolderId: Number(parentFolder.id),
        permalink: permalinkToUse,
        siteId: site.id,
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
      await setupEditorPermissions({ siteId: site.id, userId: session.userId })

      // Act
      const result = caller.create({
        folderTitle: "test folder",
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

    it("should throw 404 if `folderId` does not exist", async () => {
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
          message: "This folder does not exist",
        }),
      )
    })

    it("should throw 403 if user does not have read access to the site", async () => {
      // Arrange
      const { folder, site } = await setupFolder()

      // Act
      const result = caller.getMetadata({
        resourceId: Number(folder.id),
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

    it("should return 200 if the folder exists", async () => {
      // Arrange
      const { folder, site } = await setupFolder()
      await setupAdminPermissions({ siteId: site.id, userId: session.userId })

      // Act
      const result = await caller.getMetadata({
        resourceId: Number(folder.id),
        siteId: site.id,
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
        permalink: "news",
        resourceId: folder.id,
        siteId: String(site.id),
        title: "fake",
      })

      // Assert
      await expect(result).rejects.toThrow(
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
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = caller.editFolder({
        permalink: duplicatePermalink,
        resourceId: folder.id,
        siteId: String(site.id),
        title: "test folder",
      })

      // Assert
      await expect(result).rejects.toThrow(
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
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = await caller.editFolder({
        permalink: duplicatePermalink,
        resourceId: folder.id,
        siteId: String(site.id),
        title: "test folder",
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

    it("should throw 403 if `siteId` does not exist (no access to that site)", async () => {
      // Arrange
      const invalidSiteId = 999
      const { site, folder } = await setupFolder()
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId,
      })
      expect(site.id).not.toEqual(invalidSiteId)

      // Act
      const result = caller.editFolder({
        permalink: "test-folder",
        resourceId: folder.id,
        siteId: String(invalidSiteId),
        title: "fake",
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "FORBIDDEN",
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
        resourceType: "Page",
        siteId: site.id,
      })
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId,
      })
      await db
        .updateTable("Resource")
        .set({ parentId: page.id })
        .where("id", "=", folder.id)
        .execute()
      const permalink = "tempora-link"

      // Act
      const result = await caller.editFolder({
        permalink,
        resourceId: folder.id,
        siteId: String(site.id),
        title: folder.title,
      })

      // Assert
      const expected = await getFolderWithPermalink({
        permalink,
        siteId: site.id,
      })
      expect(result).toMatchObject({
        id: expected.id,
        parentId: page.id,
        permalink: expected.permalink,
        title: expected.title,
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
        permalink,
        resourceId: folder.id,
        siteId: String(site.id),
        title: folder.title,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "FORBIDDEN",
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
        permalink: "news",
        resourceId: page.id,
        siteId: String(site.id),
        title: "fake",
      })

      // Assert
      await expect(result).rejects.toThrow(
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
        permalink: "news",
        resourceId: "0",
        siteId: String(site.id),
        title: "fake",
      })

      // Assert
      await expect(result).rejects.toThrow(
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
      await setupEditorPermissions({ siteId: site.id, userId: session.userId })

      // Act
      const result = await caller.editFolder({
        permalink,
        resourceId: folder.id,
        siteId: String(site.id),
        title: folder.title,
      })

      // Assert
      const expected = await getFolderWithPermalink({
        permalink,
        siteId: site.id,
      })
      expect(result).toMatchObject({
        id: expected.id,
        permalink: expected.permalink,
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
        parentId: parentFolder.id,
        siteId: site.id,
      })
      await setupEditorPermissions({ siteId: site.id, userId: session.userId })

      // Act
      const result = await caller.editFolder({
        permalink,
        resourceId: folder.id,
        siteId: String(site.id),
        title: folder.title,
      })

      // Assert
      const expected = await getFolderWithPermalink({
        permalink,
        siteId: site.id,
      })
      expect(result).toMatchObject({
        id: expected.id,
        permalink: expected.permalink,
      })
      const auditLogs = await db
        .selectFrom("AuditLog")
        .selectAll()
        .executeTakeFirst()
      expect(auditLogs).toBeDefined()
      expect(auditLogs?.userId).toEqual(session.userId)
      expect(auditLogs?.eventType).toEqual(AuditLogEvent.ResourceUpdate)
    })

    describe("redirects on rename", () => {
      // Sets up a root folder with one published child page, plus admin
      // permissions on the site. Returns the ids needed to rename it.
      const setupFolderWithPublishedChild = async ({
        folderPermalink = "old-folder",
        childPermalink = "child",
      }: { folderPermalink?: string; childPermalink?: string } = {}) => {
        const { site, folder } = await setupFolder({
          permalink: folderPermalink,
        })
        const { page: child } = await setupPageResource({
          parentId: folder.id,
          permalink: childPermalink,
          resourceType: ResourceType.Page,
          siteId: site.id,
          state: ResourceState.Published,
          userId: session.userId,
        })
        await setupAdminPermissions({ siteId: site.id, userId: session.userId })
        return { child, folder, site }
      }

      it("blocks the rename when a published descendant would land under an existing redirect", async () => {
        // Arrange — a published child sits at /old-folder/child. Renaming the
        // folder to /new-folder would move it to /new-folder/child, where an
        // existing exact redirect (pointing elsewhere) already lives and would
        // shadow the relocated page.
        const { site, folder } = await setupFolderWithPublishedChild()
        await db
          .insertInto("Redirect")
          .values({
            destination: "/somewhere-else",
            siteId: site.id,
            source: "/new-folder/child",
          })
          .execute()

        // Act
        const result = caller.editFolder({
          permalink: "new-folder",
          resourceId: folder.id,
          siteId: String(site.id),
          title: "new folder",
        })

        // Assert — the move is rejected and rolled back (folder keeps its old
        // permalink), rather than silently shadowing the descendant.
        await expect(result).rejects.toThrow(
          expect.objectContaining({ code: "CONFLICT" }),
        )
        const unchanged = await db
          .selectFrom("Resource")
          .select("permalink")
          .where("id", "=", folder.id)
          .executeTakeFirstOrThrow()
        expect(unchanged.permalink).toBe("old-folder")
      })

      it("creates a wildcard redirect from the OLD path when a published descendant exists", async () => {
        // Arrange
        const { site, folder } = await setupFolderWithPublishedChild()

        // Act
        await caller.editFolder({
          permalink: "new-folder",
          resourceId: folder.id,
          siteId: String(site.id),
          title: "new folder",
        })

        // Assert — the wildcard source is the folder's OLD full permalink
        // (captured before Resource.permalink was rewritten), pointing back at
        // the folder as a reference so it follows future renames.
        const redirect = await db
          .selectFrom("Redirect")
          .select(["source", "destination", "deletedAt"])
          .where("siteId", "=", site.id)
          .executeTakeFirstOrThrow()
        expect(redirect.source).toBe("/old-folder/*")
        expect(redirect.destination).toBe(
          getReferenceLink({
            resourceId: folder.id,
            siteId: String(site.id),
          }),
        )
        expect(redirect.deletedAt).toBeNull()
      })

      it("does not create a redirect when the folder has no published descendant", async () => {
        // Arrange — the only child is a draft, so nothing is live to preserve.
        const { site, folder } = await setupFolder({ permalink: "old-folder" })
        await setupPageResource({
          parentId: folder.id,
          permalink: "child",
          resourceType: ResourceType.Page,
          siteId: site.id,
          state: ResourceState.Draft,
        })
        await setupAdminPermissions({ siteId: site.id, userId: session.userId })

        // Act
        await caller.editFolder({
          permalink: "new-folder",
          resourceId: folder.id,
          siteId: String(site.id),
          title: "new folder",
        })

        // Assert
        const redirects = await db
          .selectFrom("Redirect")
          .selectAll()
          .where("siteId", "=", site.id)
          .execute()
        expect(redirects).toHaveLength(0)
      })

      it("does not create a redirect when shouldCreateRedirect is false", async () => {
        // Arrange
        const { site, folder } = await setupFolderWithPublishedChild()

        // Act
        await caller.editFolder({
          permalink: "new-folder",
          resourceId: folder.id,
          shouldCreateRedirect: false,
          siteId: String(site.id),
          title: "new folder",
        })

        // Assert
        const redirects = await db
          .selectFrom("Redirect")
          .selectAll()
          .where("siteId", "=", site.id)
          .execute()
        expect(redirects).toHaveLength(0)
      })

      it("reclaims redirects that point back at descendants after a folder rename", async () => {
        // Arrange — reproduces the folder-swap sequence from ISOM-2525. Pages
        // were first moved from /students to /students1, creating exact
        // /students/... redirects to those pages. Renaming the new folder back
        // to /students makes those sources the pages' live URLs again.
        const { site, folder, child } = await setupFolderWithPublishedChild({
          childPermalink: "class-exam-timetable",
          folderPermalink: "students1",
        })
        const { page: sibling } = await setupPageResource({
          parentId: folder.id,
          permalink: "quick-links-information",
          resourceType: ResourceType.Page,
          siteId: site.id,
          state: ResourceState.Published,
          userId: session.userId,
        })
        await db
          .insertInto("Redirect")
          .values(
            [child, sibling].map((page) => ({
              destination: getReferenceLink({
                siteId: String(site.id),
                resourceId: page.id,
              }),
              siteId: site.id,
              source: `/students/${page.permalink}`,
            })),
          )
          .execute()

        // Act
        await caller.editFolder({
          permalink: "students",
          resourceId: folder.id,
          shouldCreateRedirect: false,
          siteId: String(site.id),
          title: "Students",
        })

        // Assert — both self-referential redirects are soft-deleted in the
        // rename transaction, so neither can shadow its now-live page.
        const redirects = await db
          .selectFrom("Redirect")
          .select(["source", "deletedAt"])
          .where("siteId", "=", site.id)
          .orderBy("source")
          .execute()
        expect(redirects).toEqual([
          {
            deletedAt: expect.any(Date),
            source: "/students/class-exam-timetable",
          },
          {
            deletedAt: expect.any(Date),
            source: "/students/quick-links-information",
          },
        ])
      })

      it("allows moving a folder back to its old path, reclaiming its own wildcard", async () => {
        // Arrange — first move /old-folder -> /new-folder creates the wildcard
        // /old-folder/* -> folder.
        const { site, folder } = await setupFolderWithPublishedChild()
        await caller.editFolder({
          permalink: "new-folder",
          resourceId: folder.id,
          siteId: String(site.id),
          title: "new folder",
        })
        const folderRef = getReferenceLink({
          resourceId: folder.id,
          siteId: String(site.id),
        })

        // Act — roll back /new-folder -> /old-folder. The folder's own
        // /old-folder/* wildcard from the first move must be reclaimed, not
        // treated as a descendant shadow that blocks the move.
        const result = caller.editFolder({
          permalink: "old-folder",
          resourceId: folder.id,
          siteId: String(site.id),
          title: "old folder",
        })

        // Assert — the rollback succeeds and the folder is back at /old-folder.
        await expect(result).resolves.toMatchObject({ permalink: "old-folder" })

        // The old-folder wildcard is reclaimed (no live redirect at /old-folder/*),
        // and a fresh /new-folder/* wildcard preserves the vacated path.
        const live = await db
          .selectFrom("Redirect")
          .select(["source", "destination"])
          .where("siteId", "=", site.id)
          .where("deletedAt", "is", null)
          .execute()
        expect(live).toEqual([
          { destination: folderRef, source: "/new-folder/*" },
        ])
      })
    })
  })

  describe("getIndexpage", () => {
    it("should throw 401 if not logged in", async () => {
      // Act
      const result = unauthedCaller.getIndexpage({
        resourceId: "1",
        siteId: 1,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should throw 403 if user does not have read access to the site", async () => {
      // Arrange
      const { folder, site } = await setupFolder()
      await setupPageResource({
        parentId: folder.id,
        resourceType: ResourceType.IndexPage,
        siteId: site.id,
      })

      // Act
      const result = caller.getIndexpage({
        resourceId: folder.id,
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
      const { folder, site } = await setupFolder()
      const { page, blob } = await setupPageResource({
        parentId: folder.id,
        resourceType: ResourceType.IndexPage,
        siteId: site.id,
      })
      await setupEditorPermissions({ siteId: site.id, userId: session.userId })

      // Act
      const result = await caller.getIndexpage({
        resourceId: folder.id,
        siteId: site.id,
      })

      // Assert
      expect(result).toEqual({
        draftBlobId: blob.id,
        id: page.id,
        title: folder.title,
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
        resourceType: "IndexPage",
        siteId: site.id,
      })
      await createChildPages({
        numFolders: 5,
        numPages: 3,
        parentId: folder.id,
        siteId: site.id,
      })

      // Act
      const result = unauthedCaller.listChildPages({
        indexPageId: indexPage.id,
        siteId: String(site.id),
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should return an empty array if `siteId` does not exist", async () => {
      // Arrange
      const invalidSiteId = 999
      const { site, folder } = await setupFolder()
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId,
      })
      expect(site.id).not.toEqual(invalidSiteId)
      const { page: indexPage } = await setupPageResource({
        parentId: folder.id,
        resourceType: "IndexPage",
        siteId: site.id,
      })
      await createChildPages({
        numFolders: 5,
        numPages: 3,
        parentId: folder.id,
        siteId: site.id,
      })

      // Act
      const result = await caller.listChildPages({
        indexPageId: indexPage.id,
        siteId: String(site.id),
      })

      // Assert
      expect(result.childPages).toEqual([])
    })

    it("should throw 403 if user does not have access to the site", async () => {
      // Arrange
      const { site, folder } = await setupFolder()
      const { page: indexPage } = await setupPageResource({
        parentId: folder.id,
        resourceType: "IndexPage",
        siteId: site.id,
      })

      // Act
      const result = caller.listChildPages({
        indexPageId: indexPage.id,
        siteId: String(site.id),
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

    it("should throw 404 if the page specified by `indexPageId` is not an `IndexPage`", async () => {
      // Arrange
      const { site, folder } = await setupFolder()
      await setupEditorPermissions({ siteId: site.id, userId: session.userId })
      const { page } = await setupPageResource({
        parentId: folder.id,
        resourceType: "Page",
        siteId: site.id,
      })

      // Act
      const result = caller.listChildPages({
        indexPageId: page.id,
        siteId: String(site.id),
      })

      // Assert
      await expect(result).rejects.toThrow(
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
        indexPageId: "1234",
        siteId: String(site.id),
      })

      // Assert
      await expect(result).rejects.toThrow(
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
        resourceType: "IndexPage",
        siteId: site.id,
      })
      const { pages, folders } = await createChildPages({
        numFolders: 4,
        numPages: 3,
        parentId: folder.id,
        siteId: site.id,
        state: "Published",
        userId: session.userId,
      })

      // NOTE: Not `published`
      await createChildPages({
        numFolders: 4,
        numPages: 3,
        parentId: folder.id,
        siteId: site.id,
      })

      // Act
      const result = await caller.listChildPages({
        indexPageId: indexPage.id,
        siteId: String(site.id),
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
const getFolderWithPermalink = async ({
  siteId,
  permalink,
}: {
  siteId: number
  permalink: string
}) =>
  await db
    .selectFrom("Resource")
    .where("type", "=", ResourceType.Folder)
    .where("siteId", "=", siteId)
    .where("permalink", "=", permalink)
    .selectAll()
    .executeTakeFirstOrThrow()

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
          parentId,
          permalink,
          resourceType: "Page",
          siteId,
          state,
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
          parentId,
          permalink: crypto.randomUUID(),
          siteId,
          state: ResourceState.Published,
        })

        const permalink = crypto.randomUUID()
        await setupPageResource({
          parentId: folder.id,
          permalink,
          resourceType: "IndexPage",
          siteId,
          state,
          userId,
        })

        return folder
      }),
  )

  return { folders, pages }
}
