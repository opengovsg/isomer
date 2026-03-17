import {
  ASSET_UPLOAD_MAX_BACKOFF_MS,
  getAssetUploadBackoffOptions,
} from "../useAssetUpload"

describe("getAssetUploadBackoffOptions", () => {
  it("should cap retry delay to avoid prolonged loading states", () => {
    // Arrange
    const config = {
      numOfAttempts: 10,
      baseTimeoutMs: 1000,
    }

    // Act
    const options = getAssetUploadBackoffOptions(config)

    // Assert
    expect(options).toStrictEqual({
      startingDelay: config.baseTimeoutMs,
      numOfAttempts: config.numOfAttempts,
      delayFirstAttempt: true,
      maxDelay: ASSET_UPLOAD_MAX_BACKOFF_MS,
    })
  })
})
