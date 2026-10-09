import { describe, expect, it } from "vitest"

import { isValidProse } from "../isValidProse"

describe("isValidProse", () => {
  it("should return true for valid prose content", () => {
    // Arrange
    const content = {
      type: "prose",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Hello world" }],
        },
      ],
    }

    // Act & Assert
    expect(isValidProse(content)).toBe(true)
  })

  it("should return false when text content contains stylized unicode", () => {
    // Arrange
    const content = {
      type: "prose",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "𝐎𝐟𝐟𝐢𝐜𝐢𝐚𝐥" }],
        },
      ],
    }

    // Act & Assert
    expect(isValidProse(content)).toBe(false)
  })

  it("should return false for structurally invalid content", () => {
    // Arrange
    // `content` requires at least one item, so an empty array is a genuine
    // structural violation.
    const content = {
      type: "prose",
      content: [],
    }

    // Act & Assert
    expect(isValidProse(content)).toBe(false)
  })

  it("should return false for undefined", () => {
    expect(isValidProse(undefined)).toBe(false)
  })
})
