import { describe, expect, it } from "vitest"

import { updatePageBlobSchema } from "../page"

describe("updatePageBlobSchema", () => {
  it("keeps the AJV path on the issue when page content fails the schema", async () => {
    // Arrange
    const content = JSON.stringify({ layout: "nope" })

    // Act
    const result = await updatePageBlobSchema.safeParseAsync({
      pageId: 1,
      siteId: 1,
      content,
    })

    // Assert
    expect(result.success).toBe(false)
    if (result.success) return

    const issue = result.error.issues[0]
    expect(issue?.message).toBe("Invalid page content")
    expect(issue?.params).toEqual({
      ajvErrors: expect.arrayContaining([
        {
          instancePath: expect.any(String),
          keyword: expect.any(String),
        },
      ]),
    })
  })
})
