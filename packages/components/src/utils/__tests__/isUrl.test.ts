import { describe, expect, it } from "vitest"

import { isUrl } from "../isUrl"

describe("isUrl", () => {
  describe("valid URLs with hostname", () => {
    it("should return true for http URLs", () => {
      const validUrls = [
        "http://example.com",
        "http://example.com/path",
        "http://example.com/path/to/page",
        "http://example.com:8080",
        "http://subdomain.example.com",
      ]

      validUrls.forEach((url) => {
        expect(isUrl(url)).toBe(true)
      })
    })

    it("should return true for https URLs", () => {
      const validUrls = [
        "https://example.com",
        "https://example.com/path",
        "https://example.com/path/to/page",
        "https://example.com:8080",
        "https://subdomain.example.com",
      ]

      validUrls.forEach((url) => {
        expect(isUrl(url)).toBe(true)
      })
    })

    it("should return true for other protocol URLs with hostname", () => {
      const validUrls = [
        "ftp://example.com",
        "ws://example.com",
        "wss://example.com",
      ]

      validUrls.forEach((url) => {
        expect(isUrl(url)).toBe(true)
      })
    })
  })

  describe("valid URLs with pathname but no hostname", () => {
    it("should return true for mailto URLs", () => {
      const validUrls = [
        "mailto:test@example.com",
        "mailto:user@domain.co.uk",
        "mailto:someone+tag@example.org",
      ]

      validUrls.forEach((url) => {
        expect(isUrl(url)).toBe(true)
      })
    })

    it("should return true for tel URLs", () => {
      const validUrls = [
        "tel:+1234567890",
        "tel:1234567890",
        "tel:+44-123-456-789",
      ]

      validUrls.forEach((url) => {
        expect(isUrl(url)).toBe(true)
      })
    })

    it("should return true for file URLs", () => {
      const validUrls = [
        "file:///path/to/file",
        "file:///C:/path/to/file",
        "file://localhost/path/to/file",
      ]

      validUrls.forEach((url) => {
        expect(isUrl(url)).toBe(true)
      })
    })

    it("should return true for custom protocol URLs with pathname", () => {
      const validUrls = [
        "weibo:user123",
        "custom:some-value",
        "app:action?param=value",
      ]

      validUrls.forEach((url) => {
        expect(isUrl(url)).toBe(true)
      })
    })
  })

  describe("invalid URLs", () => {
    it("should return false for protocol-only strings", () => {
      const invalidUrls = [
        "weibo:",
        "http:",
        "https:",
        "mailto:",
        "tel:",
        "custom:",
      ]

      invalidUrls.forEach((url) => {
        expect(isUrl(url)).toBe(false)
      })
    })

    it("should return false for relative paths", () => {
      const invalidUrls = [
        "/path/to/page",
        "./relative/path",
        "../parent/path",
        "path/to/page",
      ]

      invalidUrls.forEach((url) => {
        expect(isUrl(url)).toBe(false)
      })
    })

    it("should return false for invalid strings", () => {
      const invalidUrls = [
        "",
        " ",
        "not a url",
        "example.com",
        "www.example.com",
        "just text",
        "123456",
      ]

      invalidUrls.forEach((url) => {
        expect(isUrl(url)).toBe(false)
      })
    })

    it("should return false for malformed URLs", () => {
      const invalidUrls = [
        "http://",
        "https://",
        "://example.com",
        "http//example.com",
        "http:://example.com",
      ]

      invalidUrls.forEach((url) => {
        expect(isUrl(url)).toBe(false)
      })
    })
  })
})
