import { describe, expect, it } from "vitest"
import { MAX_IMG_FILE_SIZE_BYTES } from "~/lib/fileUpload"

import { getPresignedPutUrlForBakeSchema } from "./asset"

describe("getPresignedPutUrlForBakeSchema", () => {
  const baseInput = {
    siteId: 1,
    resourceId: "1",
    src: "https://example.com/image.jpg",
    ext: "jpeg" as const,
  }

  it("rejects a fileSize above the image size limit", () => {
    // Arrange
    const input = { ...baseInput, fileSize: MAX_IMG_FILE_SIZE_BYTES + 1 }

    // Act
    const result = getPresignedPutUrlForBakeSchema.safeParse(input)

    // Assert
    expect(result.success).toBe(false)
  })

  it("accepts a fileSize at the image size limit", () => {
    // Arrange
    const input = { ...baseInput, fileSize: MAX_IMG_FILE_SIZE_BYTES }

    // Act
    const result = getPresignedPutUrlForBakeSchema.safeParse(input)

    // Assert
    expect(result.success).toBe(true)
  })
})
