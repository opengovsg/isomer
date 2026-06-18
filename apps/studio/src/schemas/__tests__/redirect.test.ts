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

    it("should preserve single '.' characters in the source", () => {
      // Arrange / Act
      // The whitelist allows "." so real filenames/versions survive — only ".."
      // path segments are rejected
      const result = createRedirectSchema.parse({
        ...VALID_REDIRECT,
        source: "/files/report.v2.pdf",
      })

      // Assert
      expect(result.source).toBe("/files/report.v2.pdf")
    })

    it("should reject sources with characters outside the whitelist", () => {
      // Arrange
      const invalidSources = ["/bad path", "/with<angle>", "/curly{brace}"]

      invalidSources.forEach((source) => {
        // Act
        const result = createRedirectSchema.safeParse({
          ...VALID_REDIRECT,
          source,
        })

        // Assert
        expect(result.success).toBe(false)
      })
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

    it("should collapse a protocol-relative '//' destination to a single leading slash", () => {
      // Arrange / Act: "//evil.com" would otherwise be an open redirect.
      const result = createRedirectSchema.parse({
        ...VALID_REDIRECT,
        destination: "//evil.com",
      })

      // Assert
      expect(result.destination).toBe("/evil.com")
    })

    it("should leave an external https destination untouched", () => {
      // Arrange / Act
      const result = createRedirectSchema.parse({
        ...VALID_REDIRECT,
        destination: "https://www.example.gov.sg/a//b",
      })

      // Assert
      expect(result.destination).toBe("https://www.example.gov.sg/a//b")
    })
  })
})
