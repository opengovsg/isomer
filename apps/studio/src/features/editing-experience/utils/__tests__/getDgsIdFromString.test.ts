import { describe, expect, it } from "vitest"

import { getDgsIdFromString } from "../getDgsIdFromString"

describe("getDgsIdFromString", () => {
  describe("Dataset URL", () => {
    it("should extract ID from full URL format", () => {
      // Arrange
      const url = "https://data.gov.sg/datasets/d_abc123/view"

      // Act
      const result = getDgsIdFromString({ string: url })

      // Assert
      expect(result).toBe("d_abc123")
    })
  })

  describe("Dataset ID", () => {
    it("should return direct ID as-is", () => {
      // Arrange
      const url = "d_abc123"

      // Act
      const result = getDgsIdFromString({ string: url })

      // Assert
      expect(result).toBe("d_abc123")
    })

    it("should handle IDs with only numbers after d_", () => {
      // Arrange
      const id = "d_123456"

      // Act
      const result = getDgsIdFromString({ string: id })

      // Assert
      expect(result).toBe("d_123456")
    })

    it("should handle IDs with mixed case letters", () => {
      // Arrange
      const id = "d_AbC123"

      // Act
      const result = getDgsIdFromString({ string: id })

      // Assert
      expect(result).toBe("d_AbC123")
    })

    it("should handle very long valid IDs", () => {
      // Arrange
      const longId = "d_" + "a".repeat(50)

      // Act
      const result = getDgsIdFromString({ string: longId })

      // Assert
      expect(result).toBe(longId)
    })
  })

  describe("Result URL", () => {
    it("should extract resultId from URL with query parameters", () => {
      // Arrange
      const url =
        "https://data.gov.sg/datasets?page=1&formats=CSV&resultId=d_8b84c4ee58e3cfc0ece0d773c8ca6abc"

      // Act
      const result = getDgsIdFromString({ string: url })

      // Assert
      expect(result).toBe("d_8b84c4ee58e3cfc0ece0d773c8ca6abc")
    })

    it("should extract resultId from URL with resultId as first parameter", () => {
      // Arrange
      const url = "https://data.gov.sg/datasets?resultId=d_test123&page=1"

      // Act
      const result = getDgsIdFromString({ string: url })

      // Assert
      expect(result).toBe("d_test123")
    })
  })

  describe("Invalid formats", () => {
    it("should return null for invalid formats", () => {
      // Arrange
      const testStrings = [
        "invalid-url",
        "",
        "https://example.com/datasets/abc123/view",
      ]

      // Act + Assert
      testStrings.forEach((string) => {
        const result = getDgsIdFromString({ string })
        expect(result).toBeNull()
      })
    })

    it("should return null for IDs that don't start with d_", () => {
      // Arrange
      const testStrings = [
        "https://data.gov.sg/datasets/abc123/view",
        "abc123",
        "https://data.gov.sg/datasets?resultId=test123&page=1",
      ]

      // Act + Assert
      testStrings.forEach((string) => {
        const result = getDgsIdFromString({ string })
        expect(result).toBeNull()
      })
    })

    it("should return null for IDs with invalid characters", () => {
      // Arrange
      const testStrings = [
        "https://data.gov.sg/datasets/d_test-dataset_123/view",
        "d_test-dataset_123",
        "https://data.gov.sg/datasets?resultId=d_test-dataset_123&page=1",
      ]

      // Act + Assert
      testStrings.forEach((string) => {
        const result = getDgsIdFromString({ string })
        expect(result).toBeNull()
      })
    })

    it("should return null for malformed URLs", () => {
      const malformedUrls = ["not-a-url", "http://", "https://"]

      // Act + Assert
      malformedUrls.forEach((url) => {
        const result = getDgsIdFromString({ string: url })
        expect(result).toBeNull()
      })
    })

    it("should return null for URLs with incorrect path structure", () => {
      const invalidUrls = [
        "https://data.gov.sg/datasets/d_abc123",
        "https://data.gov.sg/datasets/d_abc123/edit",
        "https://data.gov.sg/datasets/d_abc123/view/extra",
      ]

      // Act + Assert
      invalidUrls.forEach((url) => {
        const result = getDgsIdFromString({ string: url })
        expect(result).toBeNull()
      })
    })

    it("should return null for resultId with invalid format", () => {
      const invalidUrls = [
        "https://data.gov.sg/datasets?resultId=invalid123&page=1",
        "https://data.gov.sg/datasets?resultId=d_invalid-format&page=1",
      ]

      // Act + Assert
      invalidUrls.forEach((url) => {
        const result = getDgsIdFromString({ string: url })
        expect(result).toBeNull()
      })
    })

    it("should handle URLs with additional query parameters", () => {
      // Arrange
      const url =
        "https://data.gov.sg/datasets?resultId=d_abc123&page=2&sort=name&filter=active"

      // Act
      const result = getDgsIdFromString({ string: url })

      // Assert
      expect(result).toBe("d_abc123")
    })

    it("should return null for empty resultId parameter", () => {
      const url = "https://data.gov.sg/datasets?resultId=&page=1"

      // Act
      const result = getDgsIdFromString({ string: url })

      // Assert
      expect(result).toBeNull()
    })
  })
})
