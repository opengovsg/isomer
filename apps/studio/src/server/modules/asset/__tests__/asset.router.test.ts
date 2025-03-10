import { TRPCError } from "@trpc/server"
import { resetTables } from "tests/integration/helpers/db"
import {
  applyAuthedSession,
  applySession,
  createMockRequest,
} from "tests/integration/helpers/iron-session"
import {
  setupEditorPermissions,
  setupSite,
  setUpWhitelist,
} from "tests/integration/helpers/seed"
import { vi } from "vitest"

import { createCallerFactory } from "~/server/trpc"
import { assetRouter } from "../asset.router"
import * as assetService from "../asset.service"

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
  })

  describe("deleteAssets", () => {
    it("should throw 401 if not logged in", async () => {
      // Arrange
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      // Act
      const result = unauthedCaller.deleteAssets({
        siteId: 1,
        fileKeys: ["test.png"],
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should throw 403 if site does not exist", async () => {
      // Arrange
      const result = caller.deleteAssets({
        siteId: 99999,
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

    it("should throw 403 if user does not have permission to read site", async () => {
      // Arrange
      const { site } = await setupSite()

      // Act
      const result = caller.deleteAssets({
        siteId: site.id,
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

    it("should return success if user has permission to read site", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId,
      })

      // Mock the markFileAsDeleted function to resolve successfully
      // Workaround as we do not really want to set up a full integration test here with S3
      vi.spyOn(assetService, "markFileAsDeleted").mockResolvedValue(undefined)

      // Act
      const result = caller.deleteAssets({
        siteId: site.id,
        fileKeys: ["test.png"],
      })

      // Assert
      // The function doesn't return a value, so we just check that it resolves without error
      await expect(result).resolves.not.toThrow()
    })
  })
})
