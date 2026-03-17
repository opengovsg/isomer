import { describe, expect, it } from "vitest"

import { getAssetUploadBackoffOptions } from "../useAssetUpload"

describe("getAssetUploadBackoffOptions", () => {
  it("caps retry delay to avoid prolonged upload lockups", () => {
    expect(
      getAssetUploadBackoffOptions({
        numOfAttempts: 10,
        baseTimeoutMs: 1000,
        maxDelayMs: 5000,
      }),
    ).toEqual({
      startingDelay: 1000,
      numOfAttempts: 10,
      delayFirstAttempt: true,
      maxDelay: 5000,
    })
  })

  it("respects custom retry configuration", () => {
    expect(
      getAssetUploadBackoffOptions({
        numOfAttempts: 4,
        baseTimeoutMs: 750,
        maxDelayMs: 2000,
      }),
    ).toEqual({
      startingDelay: 750,
      numOfAttempts: 4,
      delayFirstAttempt: true,
      maxDelay: 2000,
    })
  })
})
