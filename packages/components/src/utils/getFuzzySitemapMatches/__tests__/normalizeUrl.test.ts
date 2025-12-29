import { describe, expect, it } from "vitest"

import { normalizePermalink } from "../normalizeUrl"

describe("normalizePermalink", () => {
  describe("URL handling", () => {
    it("should extract pathname from https URL", () => {
      expect(normalizePermalink("https://example.com/docs/guide/page")).toBe(
        "docs/guide/page",
      )
    })

    it("should extract pathname from http URL", () => {
      expect(normalizePermalink("http://example.com/docs/guide/page")).toBe(
        "docs/guide/page",
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
        normalizePermalink("https://example.com/docs/guide/page?query=value"),
      ).toBe("docs/guide/page")
    })

    it("should handle URL with hash fragment", () => {
      expect(
        normalizePermalink("https://example.com/docs/guide/page#section"),
      ).toBe("docs/guide/page")
    })

    it("should handle URL with port", () => {
      expect(
        normalizePermalink("https://example.com:8080/docs/guide/page"),
      ).toBe("docs/guide/page")
    })

    it("should decode URL-encoded characters", () => {
      expect(normalizePermalink("https://example.com/path%20from%20page")).toBe(
        "path from page",
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
      expect(normalizePermalink("/docs%2Fguide%2Fpage")).toBe("docs/guide/page")
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
      expect(normalizePermalink("/docs/guide/page/")).toBe("docs/guide/page")
    })
  })

  describe("leading slash removal", () => {
    it("should remove leading slash", () => {
      expect(normalizePermalink("/docs/guide/page")).toBe("docs/guide/page")
    })

    it("should handle paths without leading slash", () => {
      expect(normalizePermalink("docs/guide/page")).toBe("docs/guide/page")
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
      expect(normalizePermalink("/x/y/z/w/v")).toBe("x/y/z/w/v")
    })
  })

  describe("stop word removal", () => {
    it("should remove common stop words", () => {
      expect(normalizePermalink("/this-is-my-life")).toBe("this my life")
    })

    it("should remove 'the' from paths", () => {
      expect(normalizePermalink("/the-quick-brown-fox")).toBe("quick brown fox")
    })

    it("should remove 'a' and 'an' from paths", () => {
      expect(normalizePermalink("/a-guide-to-an-example")).toBe("guide example")
    })

    it("should remove 'of' from paths", () => {
      expect(normalizePermalink("/department-of-finance")).toBe(
        "department finance",
      )
    })

    it("should remove 'and' from paths", () => {
      expect(normalizePermalink("/terms-and-conditions")).toBe(
        "terms conditions",
      )
    })

    it("should remove 'for' from paths", () => {
      expect(normalizePermalink("/resources-for-students")).toBe(
        "resources students",
      )
    })

    it("should remove 'in' and 'on' from paths", () => {
      expect(normalizePermalink("/events-in-2024")).toBe("events 2024")
      expect(normalizePermalink("/update-on-policy")).toBe("update policy")
    })

    it("should remove 'to' from paths", () => {
      expect(normalizePermalink("/how-to-apply")).toBe("how apply")
    })

    it("should remove 'with' and 'by' from paths", () => {
      expect(normalizePermalink("/guide-with-examples")).toBe("guide examples")
      expect(normalizePermalink("/sorted-by-date")).toBe("sorted date")
    })

    it("should remove 'be', 'is', 'are', 'was', 'were', 'been' from paths", () => {
      expect(normalizePermalink("/what-is-new")).toBe("what new")
      expect(normalizePermalink("/things-are-changing")).toBe("things changing")
    })

    it("should handle multiple stop words in a row", () => {
      expect(normalizePermalink("/a-guide-to-the-new-system")).toBe(
        "guide new system",
      )
    })

    it("should handle stop words in nested paths", () => {
      expect(normalizePermalink("/about/the-team/and-values")).toBe(
        "about/team/values",
      )
    })

    it("should remove path segments that become empty after stop word removal", () => {
      expect(normalizePermalink("/about/the/team")).toBe("about/team")
    })

    it("should preserve meaningful words", () => {
      expect(normalizePermalink("/contact-us")).toBe("contact us")
    })
  })
})
