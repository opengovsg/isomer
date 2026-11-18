import { TRPCError } from "@trpc/server"
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
  setupIsomerAdmin,
  setupPageResource,
  setUpWhitelist,
} from "tests/integration/helpers/seed"
import { vi } from "vitest"
import { deleteFile, generateSignedPutUrl, putObjectDirect } from "~/lib/s3"
import { MAX_DELETE_ASSET_URLS } from "~/schemas/asset"
import { createCallerFactory } from "~/server/trpc"
import {
  AssetLinkSource,
  AssetStatus,
  AuditLogEvent,
  IsomerAdminRole,
  ResourceType,
} from "~prisma/generated/generatedEnums"

import { invalidateAssetPaths } from "../../aws/cloudfront.service"
import { db } from "../../database"
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
  deleteFile: vi.fn().mockResolvedValue(undefined),
  listObjectKeys: vi.fn().mockResolvedValue([]),
  putObjectDirect: vi.fn().mockResolvedValue(undefined),
  isNotFoundError: vi.fn().mockReturnValue(false),
}))

// Mock CloudFront invalidation to prevent real AWS calls in CI.
vi.mock("../../aws/cloudfront.service", () => ({
  invalidateAssetPaths: vi.fn().mockResolvedValue({ success: true }),
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
    // IsomerAdmin is reset here (not just in the deleteAssetsByUrl block below)
    // because setupIsomerAdmin grants the session's user implicit Admin
    // permissions on every site — a row left behind would silently make
    // later tests in this file (e.g. uploadSvg's 403 checks) pass for the
    // wrong reason.
    await resetTables("Site", "ResourcePermission", "Resource", "IsomerAdmin")
    await setUpWhitelist({ email: TEST_VALID_EMAIL })
    vi.clearAllMocks()
    vi.mocked(generateSignedPutUrl).mockResolvedValue(
      "https://example.com/signed-url",
    )
    vi.mocked(putObjectDirect).mockResolvedValue(undefined)
  })

  describe("getPresignedPutUrl", () => {
    it("should throw 401 if not logged in", async () => {
      // Arrange
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      // Act
      const result = unauthedCaller.getPresignedPutUrl({
        siteId: 1,
        resourceId: "1",
        fileName: "test.png",
        fileSize: 1,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should throw 404 if site does not exist", async () => {
      // Arrange
      const { site, page } = await setupPageResource({
        resourceType: ResourceType.Page,
      })

      // Act
      const result = caller.getPresignedPutUrl({
        siteId: site.id + 1,
        resourceId: page.id,
        fileName: "test.png",
        fileSize: 1,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "NOT_FOUND",
          message: "The requested resource does not exist",
        }),
      )
    })

    it("should throw 403 if user does not have permission to update resource", async () => {
      // Arrange
      const { site, folder } = await setupFolder({})
      const { page } = await setupPageResource({
        resourceType: ResourceType.Page,
        parentId: folder.id,
        siteId: site.id,
      })

      // Act
      const result = caller.getPresignedPutUrl({
        siteId: site.id,
        resourceId: page.id,
        fileName: "test.png",
        fileSize: 1,
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

    it("should not register an asset when the user lacks permission", async () => {
      // Arrange
      const { site, page } = await setupPageResource({
        resourceType: ResourceType.Page,
      })

      // Act
      const result = caller.getPresignedPutUrl({
        siteId: site.id,
        resourceId: page.id,
        fileName: "denied.png",
        fileSize: 1,
      })

      // Assert
      await expect(result).rejects.toMatchObject({ code: "FORBIDDEN" })
      const assets = await db.selectFrom("Asset").select("id").execute()
      expect(assets).toEqual([])
    })

    it("should return success if user has permission to update resource", async () => {
      // Arrange
      const { site, folder } = await setupFolder({})
      const { page } = await setupPageResource({
        resourceType: ResourceType.Page,
        parentId: folder.id,
        siteId: site.id,
      })
      await setupEditorPermissions({
        siteId: site.id,
        userId: String(session.userId),
      })

      // Act
      const result = caller.getPresignedPutUrl({
        siteId: site.id,
        resourceId: page.id,
        fileName: "test.png",
        fileSize: 1,
      })

      // Assert
      await expect(result).resolves.not.toThrow()
    })

    it("should call generateSignedPutUrl with correct parameters", async () => {
      // Arrange
      const { site, page } = await setupPageResource({
        resourceType: ResourceType.Page,
      })
      await setupEditorPermissions({
        siteId: site.id,
        userId: String(session.userId),
      })
      const fileName = "test-image.png"
      const fileSize = 1234

      // Act
      await caller.getPresignedPutUrl({
        siteId: site.id,
        resourceId: page.id,
        fileName,
        fileSize,
      })

      // Assert: backend-derived ContentType and ContentDisposition are signed (not client-controlled)
      expect(generateSignedPutUrl).toHaveBeenCalledWith({
        Bucket: expect.any(String),
        Key: expect.stringContaining("test-image.png"),
        ContentType: "image/png",
        ContentDisposition: expect.stringMatching(/^inline; filename=.+/),
        ContentLength: fileSize,
        Tagging: "private=true",
      })
    })

    it("should register the asset, link it to the resource and audit it", async () => {
      // Arrange
      const { site, page } = await setupPageResource({
        resourceType: ResourceType.Page,
      })
      await setupEditorPermissions({
        siteId: site.id,
        userId: String(session.userId),
      })

      // Act
      const { fileKey } = await caller.getPresignedPutUrl({
        siteId: site.id,
        resourceId: page.id,
        fileName: "photo.png",
        fileSize: 1,
      })

      // Assert
      const asset = await db
        .selectFrom("Asset")
        .selectAll()
        .where("s3Key", "=", fileKey)
        .executeTakeFirstOrThrow()
      expect(asset).toMatchObject({
        siteId: site.id,
        uploadedBy: String(session.userId),
        status: AssetStatus.PENDING_UPLOAD,
        unreferencedAt: null,
      })
      const links = await db
        .selectFrom("AssetLink")
        .selectAll()
        .where("assetId", "=", asset.id)
        .execute()
      expect(links).toEqual([
        expect.objectContaining({
          resourceId: page.id,
          source: AssetLinkSource.RESOURCE,
          usedInDraft: false,
          usedInPublished: false,
        }),
      ])
      const auditLog = await db
        .selectFrom("AuditLog")
        .selectAll()
        .where("eventType", "=", AuditLogEvent.AssetCreate)
        .executeTakeFirstOrThrow()
      expect(auditLog).toMatchObject({
        siteId: site.id,
        userId: String(session.userId),
        delta: {
          before: null,
          after: expect.objectContaining({ s3Key: fileKey }),
        },
      })
    })

    it("should link a site-wide upload to its source", async () => {
      // Arrange
      const { site } = await setupPageResource({
        resourceType: ResourceType.Page,
      })
      await setupAdminPermissions({
        siteId: site.id,
        userId: String(session.userId),
      })

      // Act
      const { fileKey } = await caller.getPresignedPutUrl({
        siteId: site.id,
        source: AssetLinkSource.NAVBAR,
        fileName: "icon.png",
        fileSize: 1,
      })

      // Assert
      const link = await db
        .selectFrom("AssetLink")
        .innerJoin("Asset", "Asset.id", "AssetLink.assetId")
        .select(["AssetLink.resourceId", "AssetLink.source"])
        .where("Asset.s3Key", "=", fileKey)
        .executeTakeFirstOrThrow()
      expect(link).toEqual({ resourceId: null, source: AssetLinkSource.NAVBAR })
    })

    it("should register an upload with no link target without linking it", async () => {
      // Arrange
      const { site } = await setupPageResource({
        resourceType: ResourceType.Page,
      })
      await setupAdminPermissions({
        siteId: site.id,
        userId: String(session.userId),
      })

      // Act
      const { fileKey } = await caller.getPresignedPutUrl({
        siteId: site.id,
        fileName: "legacy-tab.png",
        fileSize: 1,
      })

      // Assert
      const asset = await db
        .selectFrom("Asset")
        .select("id")
        .where("s3Key", "=", fileKey)
        .executeTakeFirstOrThrow()
      const links = await db
        .selectFrom("AssetLink")
        .select("id")
        .where("assetId", "=", asset.id)
        .execute()
      expect(links).toEqual([])
    })

    it("should return contentType and contentDisposition for client to send with PUT", async () => {
      // Arrange
      const { site, page } = await setupPageResource({
        resourceType: ResourceType.Page,
      })
      await setupEditorPermissions({
        siteId: site.id,
        userId: String(session.userId),
      })

      // Act
      const result = await caller.getPresignedPutUrl({
        siteId: site.id,
        resourceId: page.id,
        fileName: "doc.pdf",
        fileSize: 1,
      })

      // Assert
      expect(result).toMatchObject({
        fileKey: expect.any(String),
        uploadConfig: {
          presignedPutUrl: "https://example.com/signed-url",
          contentType: "application/pdf",
          contentDisposition: expect.stringMatching(/^inline; filename=.+/),
          tagging: "private=true",
        },
      })
    })

    it("should throw BAD_REQUEST when called with .svg filename", async () => {
      // Arrange
      const { site, page } = await setupPageResource({
        resourceType: ResourceType.Page,
      })
      await setupEditorPermissions({
        siteId: site.id,
        userId: String(session.userId),
      })

      // Act
      const result = caller.getPresignedPutUrl({
        siteId: site.id,
        resourceId: page.id,
        fileName: "test.svg",
        fileSize: 1,
      })

      // Assert
      await expect(result).rejects.toThrow(
        expect.objectContaining({ code: "BAD_REQUEST" }),
      )
    })
  })

  describe("deleteAssetsByUrl", () => {
    // Matches NEXT_PUBLIC_S3_ASSETS_DOMAIN_NAME in .env.test — parseAssetUrlToKey
    // only resolves a key for URLs on this host with a `siteId/uuid/filename` path.
    const ASSET_DOMAIN = "user-content.example.com"
    const UUID_1 = "11111111-1111-1111-1111-111111111111"
    const UUID_2 = "22222222-2222-2222-2222-222222222222"

    it("should throw 401 if not logged in", async () => {
      // Arrange
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      // Act
      const result = unauthedCaller.deleteAssetsByUrl({
        urls: [`https://${ASSET_DOMAIN}/1/${UUID_1}/a.png`],
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should throw 403 if user is not an Isomer Core Admin", async () => {
      // Act
      const result = caller.deleteAssetsByUrl({
        urls: [`https://${ASSET_DOMAIN}/1/${UUID_1}/a.png`],
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )
      expect(deleteFile).not.toHaveBeenCalled()
    })

    it("should throw 403 for a Migrator admin (Core-only tool)", async () => {
      // Arrange
      await setupIsomerAdmin({
        userId: String(session.userId),
        role: IsomerAdminRole.Migrator,
      })

      // Act
      const result = caller.deleteAssetsByUrl({
        urls: [`https://${ASSET_DOMAIN}/1/${UUID_1}/a.png`],
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )
      expect(deleteFile).not.toHaveBeenCalled()
    })

    it("should soft-delete each asset URL and invalidate CloudFront for the exact deleted paths when caller is a Core admin", async () => {
      // Arrange
      await setupIsomerAdmin({
        userId: String(session.userId),
        role: IsomerAdminRole.Core,
      })
      vi.mocked(invalidateAssetPaths).mockResolvedValueOnce({
        success: true,
        invalidationId: "INV123",
      })
      const urls = [
        `https://${ASSET_DOMAIN}/1/${UUID_1}/a.png`,
        `https://${ASSET_DOMAIN}/2/${UUID_2}/b.png`,
      ]

      // Act
      const result = await caller.deleteAssetsByUrl({ urls })

      // Assert
      expect(result.results).toEqual([
        { url: urls[0], key: `1/${UUID_1}/a.png`, success: true },
        { url: urls[1], key: `2/${UUID_2}/b.png`, success: true },
      ])
      expect(result.invalidation).toEqual({
        success: true,
        invalidationId: "INV123",
      })
      expect(deleteFile).toHaveBeenCalledTimes(2)
      expect(invalidateAssetPaths).toHaveBeenCalledWith(
        expect.anything(),
        new Set([`1/${UUID_1}/a.png`, `2/${UUID_2}/b.png`]),
      )
    })

    it("should invalidate CloudFront for assets whose deletion failed partway", async () => {
      // Arrange
      await setupIsomerAdmin({
        userId: String(session.userId),
        role: IsomerAdminRole.Core,
      })
      vi.mocked(deleteFile).mockRejectedValueOnce(new Error("S3 unavailable"))
      const url = `https://${ASSET_DOMAIN}/1/${UUID_1}/a.png`

      // Act
      const result = await caller.deleteAssetsByUrl({ urls: [url] })

      // Assert
      expect(result.results).toEqual([
        {
          url,
          key: `1/${UUID_1}/a.png`,
          success: false,
          error: "Failed to delete asset",
        },
      ])
      expect(invalidateAssetPaths).toHaveBeenCalledWith(
        expect.anything(),
        new Set([`1/${UUID_1}/a.png`]),
      )
    })

    it("should reject and not call deleteFile when urls exceeds the cap", async () => {
      // Arrange
      await setupIsomerAdmin({
        userId: String(session.userId),
        role: IsomerAdminRole.Core,
      })
      const tooManyUrls = Array.from(
        { length: MAX_DELETE_ASSET_URLS + 1 },
        (_, i) => `https://${ASSET_DOMAIN}/1/${UUID_1}/file-${i}.png`,
      )

      // Act
      const result = caller.deleteAssetsByUrl({ urls: tooManyUrls })

      // Assert
      await expect(result).rejects.toThrow(
        `You can only delete up to ${MAX_DELETE_ASSET_URLS} assets at a time`,
      )
      expect(deleteFile).not.toHaveBeenCalled()
    })
  })

  describe("uploadSvg", () => {
    const VALID_SVG =
      '<svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10"/></svg>'

    it("should throw 401 if not logged in", async () => {
      // Arrange
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      // Act
      const result = unauthedCaller.uploadSvg({
        siteId: 1,
        fileName: "test.svg",
        content: VALID_SVG,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should throw 404 if site does not exist", async () => {
      // Arrange
      const { site, page } = await setupPageResource({
        resourceType: ResourceType.Page,
      })

      // Act
      const result = caller.uploadSvg({
        siteId: site.id + 1,
        fileName: "test.svg",
        content: VALID_SVG,
        resourceId: page.id,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "NOT_FOUND",
          message: "The requested resource does not exist",
        }),
      )
    })

    it("should throw 403 if user does not have permission", async () => {
      // Arrange
      const { site } = await setupPageResource({
        resourceType: ResourceType.Page,
      })

      // Act
      const result = caller.uploadSvg({
        siteId: site.id,
        fileName: "test.svg",
        content: VALID_SVG,
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

    it("should return BAD_REQUEST for invalid SVG content", async () => {
      // Arrange
      const { site, page } = await setupPageResource({
        resourceType: ResourceType.Page,
      })
      await setupEditorPermissions({
        siteId: site.id,
        userId: String(session.userId),
      })

      // Act
      const result = caller.uploadSvg({
        siteId: site.id,
        fileName: "test.svg",
        content: "not valid svg",
        resourceId: page.id,
      })

      // Assert
      await expect(result).rejects.toThrow(
        expect.objectContaining({ code: "BAD_REQUEST" }),
      )
    })

    it("should return BAD_REQUEST for SVG with entity bomb", async () => {
      // Arrange
      const { site, page } = await setupPageResource({
        resourceType: ResourceType.Page,
      })
      await setupEditorPermissions({
        siteId: site.id,
        userId: String(session.userId),
      })
      const entityBomb = `<!DOCTYPE svg [<!ENTITY lol "lol">]><svg xmlns="http://www.w3.org/2000/svg"/>`

      // Act
      const result = caller.uploadSvg({
        siteId: site.id,
        fileName: "test.svg",
        content: entityBomb,
        resourceId: page.id,
      })

      // Assert
      await expect(result).rejects.toThrow(
        expect.objectContaining({ code: "BAD_REQUEST" }),
      )
    })

    it("should return fileKey on successful SVG upload", async () => {
      // Arrange
      const { site, page } = await setupPageResource({
        resourceType: ResourceType.Page,
      })
      await setupEditorPermissions({
        siteId: site.id,
        userId: String(session.userId),
      })

      // Act
      const result = caller.uploadSvg({
        siteId: site.id,
        fileName: "test.svg",
        content: VALID_SVG,
        resourceId: page.id,
      })

      // Assert
      await expect(result).resolves.toMatchObject({
        fileKey: expect.stringContaining(".svg"),
      })
      expect(putObjectDirect).toHaveBeenCalledTimes(1)
    })

    it("should register a successful SVG upload as uploaded and private", async () => {
      // Arrange
      const { site, page } = await setupPageResource({
        resourceType: ResourceType.Page,
      })
      await setupEditorPermissions({
        siteId: site.id,
        userId: String(session.userId),
      })

      // Act
      const { fileKey } = await caller.uploadSvg({
        siteId: site.id,
        resourceId: page.id,
        fileName: "icon.svg",
        content: '<svg xmlns="http://www.w3.org/2000/svg"></svg>',
      })

      // Assert
      const asset = await db
        .selectFrom("Asset")
        .selectAll()
        .where("s3Key", "=", fileKey)
        .executeTakeFirstOrThrow()
      expect(asset.status).toBe(AssetStatus.UPLOADED)
      expect(asset.unreferencedAt).not.toBeNull()
      expect(putObjectDirect).toHaveBeenCalledWith(
        expect.objectContaining({ Key: fileKey, Tagging: "private=true" }),
      )
    })

    it("should leave the asset pending when the SVG write fails", async () => {
      // Arrange
      const { site, page } = await setupPageResource({
        resourceType: ResourceType.Page,
      })
      await setupEditorPermissions({
        siteId: site.id,
        userId: String(session.userId),
      })
      vi.mocked(putObjectDirect).mockRejectedValueOnce(new Error("S3 down"))

      // Act
      const result = caller.uploadSvg({
        siteId: site.id,
        resourceId: page.id,
        fileName: "icon.svg",
        content: '<svg xmlns="http://www.w3.org/2000/svg"></svg>',
      })

      // Assert
      await expect(result).rejects.toThrow()
      const asset = await db
        .selectFrom("Asset")
        .select("status")
        .executeTakeFirstOrThrow()
      expect(asset.status).toBe(AssetStatus.PENDING_UPLOAD)
    })

    it("should reject fileName not ending in .svg", async () => {
      // Arrange
      const { site, page } = await setupPageResource({
        resourceType: ResourceType.Page,
      })
      await setupEditorPermissions({
        siteId: site.id,
        userId: String(session.userId),
      })

      // Act
      const result = caller.uploadSvg({
        siteId: site.id,
        fileName: "test.png",
        content: VALID_SVG,
        resourceId: page.id,
      })

      // Assert
      await expect(result).rejects.toThrow(
        expect.objectContaining({ code: "BAD_REQUEST" }),
      )
    })
  })
})
