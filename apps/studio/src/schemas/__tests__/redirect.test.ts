import { describe, expect, it } from "vitest"

import { createRedirectSchema } from "../redirect"

const VALID_REDIRECT = {
  siteId: 1,
  source: "/old-page",
  destination: "/new-page",
}

describe("createRedirectSchema", () => {
  describe("source", () => {
    it("should normalise the source to a single leading slash with no trailing slash", () => {
      // Arrange / Act
      const result = createRedirectSchema.parse({
        ...VALID_REDIRECT,
        source: "old//path/",
      })

      // Assert
      expect(result.source).toBe("/old/path")
    })

    it("should keep an already-normalised source unchanged", () => {
      // Arrange / Act
      const result = createRedirectSchema.parse(VALID_REDIRECT)

      // Assert
      expect(result.source).toBe("/old-page")
    })

    it("should reject sources containing control characters", () => {
      // Arrange / Act
      const result = createRedirectSchema.safeParse({
        ...VALID_REDIRECT,
        source: "/bad\tpath",
      })

      // Assert
      expect(result.success).toBe(false)
    })

    it("should reject sources containing backslashes", () => {
      // Arrange / Act
      const result = createRedirectSchema.safeParse({
        ...VALID_REDIRECT,
        source: "/bad\\path",
      })

      // Assert
      expect(result.success).toBe(false)
    })

    it("should reject sources containing '..' path segments", () => {
      // Arrange / Act
      const result = createRedirectSchema.safeParse({
        ...VALID_REDIRECT,
        source: "/foo/../bar",
      })

      // Assert
      expect(result.success).toBe(false)
    })

    it("should reject sources consisting only of slashes", () => {
      // Arrange / Act
      const result = createRedirectSchema.safeParse({
        ...VALID_REDIRECT,
        source: "///",
      })

      // Assert
      expect(result.success).toBe(false)
    })

    it("should reject an empty source", () => {
      // Arrange / Act
      const result = createRedirectSchema.safeParse({
        ...VALID_REDIRECT,
        source: "",
      })

      // Assert
      expect(result.success).toBe(false)
    })
  })

  describe("destination", () => {
    it("should accept destinations starting with '/'", () => {
      // Arrange / Act
      const result = createRedirectSchema.safeParse(VALID_REDIRECT)

      // Assert
      expect(result.success).toBe(true)
    })

    it("should accept destinations starting with 'https://'", () => {
      // Arrange / Act
      const result = createRedirectSchema.safeParse({
        ...VALID_REDIRECT,
        destination: "https://www.example.gov.sg/page",
      })

      // Assert
      expect(result.success).toBe(true)
    })

    it("should reject destinations with other prefixes", () => {
      // Arrange
      const invalidDestinations = [
        "http://example.com",
        "javascript:alert(1)",
        "example.com/page",
      ]

      invalidDestinations.forEach((destination) => {
        // Act
        const result = createRedirectSchema.safeParse({
          ...VALID_REDIRECT,
          destination,
        })

        // Assert
        expect(result.success).toBe(false)
      })
    })
  })
})
