import { describe, expect, it } from "vitest"

import { getDgsIdFromDgsLink } from "../getDgsIdFromDgsLink"

describe("getDgsIdFromDgsLink", () => {
  describe("valid DGS links", () => {
    it("should extract DGS ID from a simple DGS link", () => {
      const result = getDgsIdFromDgsLink("[dgs:test123]")
      expect(result).toBe("test123")
    })

    it("should extract DGS ID with alphanumeric characters", () => {
      const result = getDgsIdFromDgsLink("[dgs:abc123def]")
      expect(result).toBe("abc123def")
    })

    it("should extract DGS ID with underscores", () => {
      const result = getDgsIdFromDgsLink("[dgs:test_id_123]")
      expect(result).toBe("test_id_123")
    })

    it("should extract DGS ID with mixed case", () => {
      const result = getDgsIdFromDgsLink("[dgs:TestID123]")
      expect(result).toBe("TestID123")
    })
  })

  describe("invalid DGS links", () => {
    it("should return null for empty string", () => {
      const result = getDgsIdFromDgsLink("")
      expect(result).toBeNull()
    })

    it("should return null for text without DGS link", () => {
      const result = getDgsIdFromDgsLink("This is just regular text")
      expect(result).toBeNull()
    })

    it("should return null for malformed DGS link - missing closing bracket", () => {
      const result = getDgsIdFromDgsLink("[dgs:test123")
      expect(result).toBeNull()
    })

    it("should return null for malformed DGS link - missing opening bracket", () => {
      const result = getDgsIdFromDgsLink("dgs:test123]")
      expect(result).toBeNull()
    })

    it("should return null for malformed DGS link - wrong prefix", () => {
      const result = getDgsIdFromDgsLink("[link:test123]")
      expect(result).toBeNull()
    })

    it("should return null for DGS link with empty ID", () => {
      const result = getDgsIdFromDgsLink("[dgs:]")
      expect(result).toBeNull()
    })

    it("should return null for DGS link with special characters in ID", () => {
      const result = getDgsIdFromDgsLink("[dgs:test-123]")
      expect(result).toBeNull()
    })

    it("should return null for DGS link with spaces in ID", () => {
      const result = getDgsIdFromDgsLink("[dgs:test 123]")
      expect(result).toBeNull()
    })
  })

  describe("edge cases", () => {
    it("should handle DGS link with only numbers", () => {
      const result = getDgsIdFromDgsLink("[dgs:123456]")
      expect(result).toBe("123456")
    })

    it("should handle DGS link with only letters", () => {
      const result = getDgsIdFromDgsLink("[dgs:abcdef]")
      expect(result).toBe("abcdef")
    })

    it("should handle DGS link with only underscores", () => {
      const result = getDgsIdFromDgsLink("[dgs:___]")
      expect(result).toBe("___")
    })

    it("should handle very long DGS ID", () => {
      const longId = "a".repeat(100)
      const result = getDgsIdFromDgsLink(`[dgs:${longId}]`)
      expect(result).toBe(longId)
    })

    it("should handle DGS link with extra whitespace around brackets", () => {
      const result = getDgsIdFromDgsLink(" [dgs:test123] ")
      expect(result).toBe("test123")
    })
  })
})
