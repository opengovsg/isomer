// @vitest-environment jsdom
import { renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  getAssetUploadBackoffOptions,
  MAX_ASSET_UPLOAD_BACKOFF_DELAY_MS,
  useAssetUpload,
} from "../useAssetUpload"

const reportClientError = vi.hoisted(() => vi.fn())
vi.mock("~/lib/datadogError", () => ({ reportClientError }))
vi.mock("~/utils/generateAssetUrl", () => ({ ASSETS_BASE_URL: "" }))

describe("useAssetUpload backoff options", () => {
  it("should cap exponential retry delay", () => {
    // Act
    const options = getAssetUploadBackoffOptions({})

    // Assert
    expect(options.maxDelay).toBe(MAX_ASSET_UPLOAD_BACKOFF_DELAY_MS)
    expect(options.numOfAttempts).toBe(10)
    expect(options.startingDelay).toBe(1000)
    expect(options.delayFirstAttempt).toBe(true)
  })

  it("should preserve caller-provided attempt and base timeout values", () => {
    // Act
    const options = getAssetUploadBackoffOptions({
      numOfAttempts: 4,
      baseTimeoutMs: 250,
    })

    // Assert
    expect(options.numOfAttempts).toBe(4)
    expect(options.startingDelay).toBe(250)
    expect(options.maxDelay).toBe(MAX_ASSET_UPLOAD_BACKOFF_DELAY_MS)
  })
})

describe("useAssetUpload", () => {
  beforeEach(() => {
    reportClientError.mockClear()
    vi.stubGlobal("fetch", vi.fn())
  })

  it("reports the error to Datadog when the fetch-back never succeeds", async () => {
    // Arrange
    vi.mocked(fetch).mockResolvedValue({ ok: false } as Response)
    const { result } = renderHook(() =>
      useAssetUpload({ numOfAttempts: 1, baseTimeoutMs: 0 }),
    )

    // Act
    const upload = result.current.handleAssetUpload("/path/to/file.png", {
      siteId: 1,
      resourceId: "resource-1",
    })

    // Assert
    await expect(upload).rejects.toThrow(
      "Unable to read from /path/to/file.png",
    )
    expect(reportClientError).toHaveBeenCalledWith(expect.any(Error), {
      feature: "asset-upload-fetch",
      siteId: 1,
      resourceId: "resource-1",
    })
  })

  it("does not report anything when the fetch-back succeeds", async () => {
    // Arrange
    vi.mocked(fetch).mockResolvedValue({ ok: true } as Response)
    const { result } = renderHook(() =>
      useAssetUpload({ numOfAttempts: 1, baseTimeoutMs: 0 }),
    )

    // Act
    await result.current.handleAssetUpload("/path/to/file.png")

    // Assert
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(reportClientError).not.toHaveBeenCalled()
  })
})
