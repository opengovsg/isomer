import { describe, expect, it } from "vitest"

import {
  getAssetUploadBackoffOptions,
  MAX_ASSET_UPLOAD_BACKOFF_DELAY_MS,
} from "../useAssetUpload"

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
