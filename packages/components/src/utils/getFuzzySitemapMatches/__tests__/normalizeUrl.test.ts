import { describe, expect, it } from "vitest"

import { normalizePermalink } from "../normalizeUrl"

describe("normalizePermalink", () => {
  describe("URL handling", () => {
    it("should extract pathname from https URL", () => {
      expect(normalizePermalink("https://example.com/path/to/page")).toBe(
        "path/to/page",
      )
    })

    it("should extract pathname from http URL", () => {
      expect(normalizePermalink("http://example.com/path/to/page")).toBe(
        "path/to/page",
      )
    })

    it("should handle URL with root path", () => {
      expect(normalizePermalink("https://example.com/")).toBe("")
    })

    it("should handle URL without trailing slash", () => {
      expect(normalizePermalink("https://example.com")).toBe("")
    })

    it("should apply normalization to URL pathname", () => {
      expect(normalizePermalink("https://example.com/my-page_name")).toBe(
        "my page name",
      )
    })

    it("should handle URL with query parameters", () => {
      expect(
        normalizePermalink("https://example.com/path/to/page?query=value"),
      ).toBe("path/to/page")
    })

    it("should handle URL with hash fragment", () => {
      expect(
        normalizePermalink("https://example.com/path/to/page#section"),
      ).toBe("path/to/page")
    })

    it("should handle URL with port", () => {
      expect(normalizePermalink("https://example.com:8080/path/to/page")).toBe(
        "path/to/page",
      )
    })

    it("should decode URL-encoded characters", () => {
      expect(normalizePermalink("https://example.com/path%20to%20page")).toBe(
        "path to page",
      )
    })

    it("should handle URL-encoded special characters", () => {
      expect(normalizePermalink("https://example.com/caf%C3%A9")).toBe("café")
    })
  })

  describe("URL decoding", () => {
    it("should decode %20 as space", () => {
      expect(normalizePermalink("/about%20us")).toBe("about us")
    })

    it("should decode multiple encoded characters", () => {
      expect(normalizePermalink("/path%2Fto%2Fpage")).toBe("path/to/page")
    })

    it("should handle invalid percent encoding gracefully", () => {
      expect(normalizePermalink("/path%ZZ")).toBe("path%zz")
    })

    it("should decode unicode characters", () => {
      expect(normalizePermalink("/%E4%B8%AD%E6%96%87")).toBe("中文")
    })
  })

  describe("trailing slash removal", () => {
    it("should remove single trailing slash", () => {
      expect(normalizePermalink("/about/")).toBe("about")
    })

    it("should remove multiple trailing slashes", () => {
      expect(normalizePermalink("/about///")).toBe("about")
    })

    it("should handle path with trailing slash and segments", () => {
      expect(normalizePermalink("/path/to/page/")).toBe("path/to/page")
    })
  })

  describe("leading slash removal", () => {
    it("should remove leading slash", () => {
      expect(normalizePermalink("/path/to/page")).toBe("path/to/page")
    })

    it("should handle paths without leading slash", () => {
      expect(normalizePermalink("path/to/page")).toBe("path/to/page")
    })

    it("should return empty string for root path", () => {
      expect(normalizePermalink("/")).toBe("")
    })

    it("should return empty string for empty string", () => {
      expect(normalizePermalink("")).toBe("")
    })
  })

  describe("delimiter conversion", () => {
    it("should convert hyphens to spaces", () => {
      expect(normalizePermalink("/my-page-name")).toBe("my page name")
    })

    it("should convert underscores to spaces", () => {
      expect(normalizePermalink("/my_page_name")).toBe("my page name")
    })

    it("should handle mixed hyphens and underscores", () => {
      expect(normalizePermalink("/my-page_name")).toBe("my page name")
    })

    it("should collapse multiple consecutive delimiters", () => {
      expect(normalizePermalink("/my--page__name")).toBe("my page name")
    })

    it("should handle alternating delimiters", () => {
      expect(normalizePermalink("/my-_-page")).toBe("my page")
    })
  })

  describe("case normalization", () => {
    it("should convert uppercase to lowercase", () => {
      expect(normalizePermalink("/MY-PAGE")).toBe("my page")
    })

    it("should convert mixed case to lowercase", () => {
      expect(normalizePermalink("/My-Page-Name")).toBe("my page name")
    })
  })

  describe("file extension removal", () => {
    it("should strip file extensions", () => {
      expect(normalizePermalink("/docs/my-file.pdf")).toBe("docs/my file")
    })

    it("should handle various extensions", () => {
      expect(normalizePermalink("/page.html")).toBe("page")
      expect(normalizePermalink("/document.docx")).toBe("document")
    })
  })

  describe("complex paths", () => {
    it("should handle nested paths with delimiters", () => {
      expect(normalizePermalink("/parent-section/child_page/item")).toBe(
        "parent section/child page/item",
      )
    })

    it("should handle deeply nested paths", () => {
      expect(normalizePermalink("/a/b/c/d/e")).toBe("a/b/c/d/e")
    })
  })
})
