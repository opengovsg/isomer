import { CreateInvalidationCommand } from "@aws-sdk/client-cloudfront"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { env } from "~/env.mjs"

import { invalidateAssetsBySiteIds } from "../cloudfront.service"

const { mockSend } = vi.hoisted(() => ({ mockSend: vi.fn() }))

vi.mock("@aws-sdk/client-cloudfront", () => ({
  // `function`, not an arrow, so `new CloudFrontClient(...)` /
  // `new CreateInvalidationCommand(...)` in the module under test can
  // construct them.
  CloudFrontClient: vi.fn(function () {
    return { send: mockSend }
  }),
  CreateInvalidationCommand: vi.fn(function (input: unknown) {
    return input
  }),
}))

vi.mock("~/env.mjs", () => ({
  env: { CLOUDFRONT_ASSETS_DISTRIBUTION_ID: "" },
}))

const mockLogger = { error: vi.fn() } as unknown as Parameters<
  typeof invalidateAssetsBySiteIds
>[0]

describe("invalidateAssetsBySiteIds", () => {
  beforeEach(() => {
    mockSend.mockReset()
    env.CLOUDFRONT_ASSETS_DISTRIBUTION_ID = ""
  })

  it("should return success without calling CloudFront when there are no siteIds", async () => {
    // Act
    const result = await invalidateAssetsBySiteIds(mockLogger, new Set())

    // Assert
    expect(result).toEqual({ success: true })
    expect(mockSend).not.toHaveBeenCalled()
  })

  it("should return failure when the distribution id is not configured", async () => {
    // Act
    const result = await invalidateAssetsBySiteIds(mockLogger, new Set(["1"]))

    // Assert
    expect(result).toEqual({
      success: false,
      error: "CLOUDFRONT_ASSETS_DISTRIBUTION_ID is not configured",
    })
    expect(mockSend).not.toHaveBeenCalled()
  })

  it("should create one invalidation batching a path per unique siteId when configured", async () => {
    // Arrange
    env.CLOUDFRONT_ASSETS_DISTRIBUTION_ID = "DIST123"
    mockSend.mockResolvedValueOnce({ Invalidation: { Id: "INV123" } })

    // Act
    const result = await invalidateAssetsBySiteIds(mockLogger, ["1", "2", "1"])

    // Assert
    expect(result).toEqual({ success: true, invalidationId: "INV123" })
    expect(CreateInvalidationCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        DistributionId: "DIST123",
        InvalidationBatch: expect.objectContaining({
          Paths: { Quantity: 2, Items: ["/1/*", "/2/*"] },
        }),
      }),
    )
  })

  it("should return a generic failure message when CloudFront throws, without leaking the underlying error", async () => {
    // Arrange
    env.CLOUDFRONT_ASSETS_DISTRIBUTION_ID = "DIST123"
    mockSend.mockRejectedValueOnce(new Error("Access denied"))

    // Act
    const result = await invalidateAssetsBySiteIds(mockLogger, ["1"])

    // Assert
    expect(result).toEqual({
      success: false,
      error: "Failed to invalidate CloudFront cache",
    })
  })
})
