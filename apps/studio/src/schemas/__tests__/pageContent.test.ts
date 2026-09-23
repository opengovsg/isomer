import { describe, expect, it } from "vitest"

import { pageContentAjvErrors, updatePageBlobSchema } from "../page"

describe("updatePageBlobSchema", () => {
  it("keeps the AJV path when page content fails the schema", async () => {
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

    expect(result.error.issues[0]?.message).toBe("Invalid page content")
    expect(pageContentAjvErrors(result.error).length).toBeGreaterThan(0)
    expect(pageContentAjvErrors(result.error)[0]).toEqual({
      instancePath: expect.any(String),
      keyword: expect.any(String),
    })
  })

  it("returns no AJV errors for an unrelated failure", () => {
    // Arrange / Act / Assert
    expect(pageContentAjvErrors(new Error("nope"))).toEqual([])
  })
})
