import { describe, expect, it } from "vitest"

import { normalizePermalink } from "../normalizeUrl"

describe("normalizePermalink", () => {
  describe("basic URL normalization", () => {
    it("should extract pathname without leading slash", () => {
      expect(normalizePermalink("https://example.com/path/to/page")).toBe(
        "path/to/page",
      )
    })

    it("should return empty string for URLs without path", () => {
      expect(normalizePermalink("https://example.com")).toBe("")
    })

    it("should return empty string for URLs with only trailing slash", () => {
      expect(normalizePermalink("https://example.com/")).toBe("")
    })

    it("should strip query strings", () => {
      expect(
        normalizePermalink("https://example.com/page?foo=bar&baz=qux"),
      ).toBe("page")
    })

    it("should strip hash fragments", () => {
      expect(normalizePermalink("https://example.com/page#section")).toBe(
        "page",
      )
    })

    it("should strip both query strings and hash fragments", () => {
      expect(
        normalizePermalink("https://example.com/page?foo=bar#section"),
      ).toBe("page")
    })

    it("should strip port numbers", () => {
      expect(normalizePermalink("https://example.com:8080/page")).toBe("page")
    })
  })

  describe("protocol handling", () => {
    it("should work with http URLs", () => {
      expect(normalizePermalink("http://example.com/page")).toBe("page")
    })

    it("should work with https URLs", () => {
      expect(normalizePermalink("https://example.com/page")).toBe("page")
    })
  })

  describe("delimiter conversion", () => {
    it("should convert hyphens to spaces", () => {
      expect(normalizePermalink("https://example.com/my-page-name")).toBe(
        "my page name",
      )
    })

    it("should convert underscores to spaces", () => {
      expect(normalizePermalink("https://example.com/my_page_name")).toBe(
        "my page name",
      )
    })

    it("should handle mixed hyphens and underscores", () => {
      expect(normalizePermalink("https://example.com/my-page_name")).toBe(
        "my page name",
      )
    })

    it("should collapse multiple consecutive delimiters", () => {
      expect(normalizePermalink("https://example.com/my--page__name")).toBe(
        "my page name",
      )
    })

    it("should handle alternating delimiters", () => {
      expect(normalizePermalink("https://example.com/my-_-page")).toBe(
        "my page",
      )
    })
  })

  describe("case normalization", () => {
    it("should convert uppercase to lowercase", () => {
      expect(normalizePermalink("https://EXAMPLE.COM/MY-PAGE")).toBe("my page")
    })

    it("should convert mixed case to lowercase", () => {
      expect(normalizePermalink("https://Example.Com/My-Page-Name")).toBe(
        "my page name",
      )
    })
  })

  describe("complex paths", () => {
    it("should handle nested paths with delimiters", () => {
      expect(
        normalizePermalink(
          "https://example.com/parent-section/child_page/item",
        ),
      ).toBe("parent section/child page/item")
    })

    it("should handle paths with file extensions", () => {
      expect(normalizePermalink("https://example.com/docs/my-file.pdf")).toBe(
        "docs/my file",
      )
    })
  })

  describe("invalid URLs (fallback behavior)", () => {
    it("should return original string for invalid URL", () => {
      expect(normalizePermalink("not-a-valid-url")).toBe("not-a-valid-url")
    })

    it("should return original string for empty string", () => {
      expect(normalizePermalink("")).toBe("")
    })

    it("should return original string for relative paths", () => {
      expect(normalizePermalink("/path/to/page")).toBe("/path/to/page")
    })

    it("should return original string for malformed URLs", () => {
      expect(normalizePermalink("http://")).toBe("http://")
    })
  })
})
