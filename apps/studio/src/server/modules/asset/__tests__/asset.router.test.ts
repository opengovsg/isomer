import { TRPCError } from "@trpc/server"
import { ResourceType } from "~prisma/generated/generatedEnums"
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
  setupPublisherPermissions,
  setupSite,
  setUpWhitelist,
} from "tests/integration/helpers/seed"
import { vi } from "vitest"

import { deleteFile, generateSignedPutUrl } from "~/lib/s3"
import { createCallerFactory } from "~/server/trpc"
import { assetRouter } from "../asset.router"

// Mock the S3 client to prevent credential loading issues in CI
// Workaround as we do not really want to set up a full integration test here with S3
vi.mock("~/lib/s3", () => ({
  storage: {
    send: vi.fn().mockResolvedValue({ TagSet: [] }),
  },
  generateSignedPutUrl: vi
    .fn()
    .mockResolvedValue("https://example.com/signed-url"),
  markFileAsDeleted: vi.fn().mockResolvedValue(undefined),
  deleteFile: vi.fn().mockResolvedValue(undefined),
}))

const createCaller = createCallerFactory(assetRouter)

describe("asset.router", async () => {
  let caller: ReturnType<typeof createCaller>
  const session = await applyAuthedSession()

  const TEST_VALID_EMAIL = "test@open.gov.sg"

  beforeAll(() => {
    caller = createCaller(createMockRequest(session))
  })

  beforeEach(async () => {
    await resetTables("Site", "ResourcePermission", "Resource")
    await setUpWhitelist({ email: TEST_VALID_EMAIL })
    // Reset any mocks after each test
    vi.restoreAllMocks()
  })

  describe("getPresignedPutUrl", () => {
    it("should throw 401 if not logged in", async () => {
      // Arrange
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      // Act
      const result = unauthedCaller.getPresignedPutUrl({
        siteId: 1,
        fileName: "test.png",
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should throw 403 if site does not exist", async () => {
      // Act
      const result = caller.getPresignedPutUrl({
        siteId: 99999,
        fileName: "test.png",
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

    it("should throw 403 if user does not have permission to read site", async () => {
      // Arrange
      const { site } = await setupSite()

      // Act
      const result = caller.getPresignedPutUrl({
        siteId: site.id,
        fileName: "test.png",
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

    it("should return success if user has permission to read site", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = caller.getPresignedPutUrl({
        siteId: site.id,
        fileName: "test.png",
      })

      // Assert
      await expect(result).resolves.not.toThrow()
    })

    it("should call generateSignedPutUrl with correct parameters", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId,
      })
      const fileName = "test-image.png"

      // Act
      await caller.getPresignedPutUrl({
        siteId: site.id,
        fileName,
      })

      // Assert
      expect(generateSignedPutUrl).toHaveBeenCalledWith({
        Bucket: expect.any(String),
        Key: expect.any(String),
      })
    })
  })

  describe("deleteAssets", () => {
    it("should throw 401 if not logged in", async () => {
      // Arrange
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      // Act
      const result = unauthedCaller.deleteAssets({
        siteId: 1,
        resourceId: "1",
        fileKeys: ["test.png"],
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should throw 403 if site does not exist", async () => {
      // Arrange
      const { site, page } = await setupPageResource({
        resourceType: ResourceType.Page,
      })
      const result = caller.deleteAssets({
        siteId: site.id + 1,
        resourceId: page.id,
        fileKeys: ["test.png"],
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

    it("should throw 403 if user does not have permission to read resource", async () => {
      // Arrange
      const { site } = await setupSite()
      const { folder } = await setupFolder({
        siteId: site.id,
      })
      const { page } = await setupPageResource({
        resourceType: ResourceType.Page,
        parentId: folder.id,
        siteId: site.id,
      })

      // Act
      const result = caller.deleteAssets({
        siteId: site.id,
        resourceId: page.id,
        fileKeys: ["test.png"],
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

    it("should return success if user only has Editor permission to read non-root resource", async () => {
      // Arrange
      const { site } = await setupSite()
      const { folder } = await setupFolder({
        siteId: site.id,
      })
      const { page } = await setupPageResource({
        resourceType: ResourceType.Page,
        parentId: folder.id,
        siteId: site.id,
      })
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = caller.deleteAssets({
        siteId: site.id,
        resourceId: page.id,
        fileKeys: ["test.png"],
      })

      // Assert
      await expect(result).resolves.not.toThrow()
    })

    it("should throw 403 if user does only has Editor permission to read root resource", async () => {
      // Arrange
      const { site } = await setupSite()
      const { page } = await setupPageResource({
        resourceType: ResourceType.Page,
        siteId: site.id,
      })
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = caller.deleteAssets({
        siteId: site.id,
        resourceId: page.id,
        fileKeys: ["test.png"],
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

    it("should return success if user only has Publisher permission to read non-root resource", async () => {
      // Arrange
      const { site } = await setupSite()
      const { folder } = await setupFolder({
        siteId: site.id,
      })
      const { page } = await setupPageResource({
        resourceType: ResourceType.Page,
        parentId: folder.id,
        siteId: site.id,
      })
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = caller.deleteAssets({
        siteId: site.id,
        resourceId: page.id,
        fileKeys: ["test.png"],
      })

      // Assert
      await expect(result).resolves.not.toThrow()
    })

    it("should throw 403 if user does only has Publisher permission to read root resource", async () => {
      // Arrange
      const { site } = await setupSite()
      const { page } = await setupPageResource({
        resourceType: ResourceType.Page,
        siteId: site.id,
      })
      await setupPublisherPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = caller.deleteAssets({
        siteId: site.id,
        resourceId: page.id,
        fileKeys: ["test.png"],
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

    it("should return success if user only has Admin permission to read root resource", async () => {
      // Arrange
      const { site } = await setupSite()
      const { page } = await setupPageResource({
        resourceType: ResourceType.Page,
        siteId: site.id,
      })
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Act
      const result = caller.deleteAssets({
        siteId: site.id,
        resourceId: page.id,
        fileKeys: ["test.png"],
      })

      // Assert
      await expect(result).resolves.not.toThrow()
    })

    it("should call deleteFile with correct parameters for each file key", async () => {
      // Arrange
      const { site } = await setupSite()
      const { page } = await setupPageResource({
        resourceType: ResourceType.Page,
        siteId: site.id,
      })
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId,
      })
      const fileKeys = ["file1.png", "file2.jpg", "file3.pdf"]

      // Act
      await caller.deleteAssets({
        siteId: site.id,
        resourceId: page.id,
        fileKeys,
      })

      // Assert
      expect(deleteFile).toHaveBeenCalledTimes(fileKeys.length)
      fileKeys.forEach((fileKey) => {
        expect(deleteFile).toHaveBeenCalledWith({
          Bucket: expect.any(String),
          Key: fileKey,
        })
      })
    })
  })
})
