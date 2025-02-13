import { TRPCError } from "@trpc/server"
import {
  applyAuthedSession,
  applySession,
  createMockRequest,
} from "tests/integration/helpers/iron-session"
import {
  setupAdminPermissions,
  setupFolder,
  setupPageResource,
  setupSite,
} from "tests/integration/helpers/seed"

import { createCallerFactory } from "~/server/trpc"
import { db } from "../../database"
import { folderRouter } from "../folder.router"

const createCaller = createCallerFactory(folderRouter)

describe("folder.router", async () => {
  let caller: ReturnType<typeof createCaller>
  let unauthedCaller: ReturnType<typeof createCaller>
  const session = await applyAuthedSession()

  beforeAll(async () => {
    caller = createCaller(createMockRequest(session))
    const unauthedSession = applySession()
    unauthedCaller = createCaller(createMockRequest(unauthedSession))
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
    })

    // TODO: Add tests when permissions are implemented
    it("should throw 403 if user does not have write access to the site", async () => {
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
    })

    it.skip("should throw 403 if user does not have write access to the parent folder", async () => {})
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
    .where("type", "=", "Folder")
    .where("siteId", "=", siteId)
    .where("permalink", "=", permalink)
    .selectAll()
    .executeTakeFirstOrThrow()
}
