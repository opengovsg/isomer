import { describe, expect, it } from "vitest"
import {
  LINK_HREF_PATTERN,
  NO_STYLIZED_UNICODE_REGEX,
  NON_EMPTY_STRING_REGEX,
} from "~/utils/validation"

import { IsomerString } from "../IsomerString"

describe("IsomerString", () => {
  it("should set NO_STYLIZED_UNICODE_REGEX as the pattern when no pattern is passed", () => {
    // Arrange / Act
    const schema = IsomerString({ title: "Some field" })

    // Assert
    expect(schema.pattern).toBe(NO_STYLIZED_UNICODE_REGEX)
    expect(schema.title).toBe("Some field")
  })

  it("should still allow valid links when joined with LINK_HREF_PATTERN, without alternation leaking through", () => {
    // Arrange
    const schema = IsomerString({ pattern: LINK_HREF_PATTERN })
    const combined = new RegExp(schema.pattern!)
    const testCases = ["tel:12345678", "https://example.com"]

    testCases.forEach((testCase) => {
      // Act
      const result = combined.test(testCase)

      // Assert
      expect(result).toBe(true)
    })
  })

  it("should reject stylized-unicode links and unsupported protocols when joined with LINK_HREF_PATTERN", () => {
    // Arrange
    const schema = IsomerString({ pattern: LINK_HREF_PATTERN })
    const combined = new RegExp(schema.pattern!)
    const testCases = [
      "𝐭𝐞𝐥:12345678",
      "𝐡𝐭𝐭𝐩𝐬://example.com",
      "ftp://example.com",
    ]

    testCases.forEach((testCase) => {
      // Act
      const result = combined.test(testCase)

      // Assert
      expect(result).toBe(false)
    })
  })

  it("should still allow non-empty text when joined with NON_EMPTY_STRING_REGEX", () => {
    // Arrange / Act
    const schema = IsomerString({ pattern: NON_EMPTY_STRING_REGEX })
    const combined = new RegExp(schema.pattern!)
    const result = combined.test("hello")

    // Assert
    expect(result).toBe(true)
  })

  it("should reject empty string and stylized unicode when joined with NON_EMPTY_STRING_REGEX", () => {
    // Arrange
    const schema = IsomerString({ pattern: NON_EMPTY_STRING_REGEX })
    const combined = new RegExp(schema.pattern!)
    const testCases = ["", "𝐡𝐞𝐥𝐥𝐨"]

    testCases.forEach((testCase) => {
      // Act
      const result = combined.test(testCase)

      // Assert
      expect(result).toBe(false)
    })
  })

  it("should concatenate errorMessage.pattern when one already exists", () => {
    // Arrange / Act
    const schema = IsomerString({
      pattern: NON_EMPTY_STRING_REGEX,
      errorMessage: { pattern: "cannot be empty or contain only spaces" },
    })

    // Assert
    expect(schema.errorMessage).toEqual({
      pattern:
        "cannot be empty or contain only spaces; cannot contain stylised or decorative unicode characters",
    })
  })

  it("should default errorMessage.pattern when none exists", () => {
    // Arrange / Act
    const schema = IsomerString()

    // Assert
    expect(schema.errorMessage).toEqual({
      pattern: "cannot contain stylised or decorative unicode characters",
    })
  })
})
