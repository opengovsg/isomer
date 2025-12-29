import { describe, expect, it } from "vitest"

import { getSimilarSitemapMatches } from "../getSimilarSitemapMatches"

describe("getSimilarSitemapMatches", () => {
  const mockSitemap = [
    { permalink: "https://example.com/about-us", title: "About Us" },
    { permalink: "https://example.com/contact", title: "Contact" },
    {
      permalink: "https://example.com/services/web-development",
      title: "Web Development",
    },
    { permalink: "https://example.com/services/mobile-apps", title: "Mobile Apps" },
    { permalink: "https://example.com/blog/hello-world", title: "Hello World" },
  ]

  describe("basic functionality", () => {
    it("should find exact matches when searching", () => {
      // Arrange & Act
      const results = getSimilarSitemapMatches({
        sitemap: mockSitemap,
        query: "about",
      })

      // Assert
      expect(results.length).toBe(1)
      expect(results.map((r) => r.item.entity.permalink)).toEqual([
        "https://example.com/about-us",
      ])
    })

    it("should find fuzzy matches when searching", () => {
      // Arrange & Act
      const results = getSimilarSitemapMatches({
        sitemap: mockSitemap,
        query: "contct",
      })

      // Assert
      expect(results.length).toBe(1)
      expect(results.map((r) => r.item.entity.permalink)).toEqual([
        "https://example.com/contact",
      ])
    })
  })

  describe("URL normalization in matching", () => {
    it("should match URLs with hyphens converted to spaces", () => {
      // Arrange & Act
      const results = getSimilarSitemapMatches({
        sitemap: mockSitemap,
        query: "about us",
      })

      // Assert
      expect(results.length).toBe(1)
      expect(results.map((r) => r.item.entity.permalink)).toEqual([
        "https://example.com/about-us",
      ])
    })

    it("should match nested paths", () => {
      // Arrange & Act
      const results = getSimilarSitemapMatches({
        sitemap: mockSitemap,
        query: "web development",
      })

      // Assert
      expect(results.length).toBe(1)
      expect(results.map((r) => r.item.entity.permalink)).toEqual([
        "https://example.com/services/web-development",
      ])
    })

    it("should match partial path segments", () => {
      // Arrange & Act
      const results = getSimilarSitemapMatches({
        sitemap: mockSitemap,
        query: "services",
      })

      // Assert
      expect(results.length).toBe(2)
      expect(results.map((r) => r.item.entity.permalink)).toEqual([
        "https://example.com/services/web-development",
        "https://example.com/services/mobile-apps",
      ])
    })
  })

  describe("edge cases", () => {
    it("should handle empty sitemap", () => {
      // Arrange & Act
      const results = getSimilarSitemapMatches({
        sitemap: [],
        query: "test",
      })

      // Assert
      expect(results.length).toBe(0)
    })

    it("should handle empty query", () => {
      // Arrange & Act
      const results = getSimilarSitemapMatches({
        sitemap: mockSitemap,
        query: "",
      })

      // Assert
      expect(results.length).toBe(0)
    })

    it("should handle query with no matches", () => {
      // Arrange & Act
      const results = getSimilarSitemapMatches({
        sitemap: mockSitemap,
        query: "zzzznonexistent",
      })

      // Assert
      expect(results.length).toBe(0)
    })

    it("should preserve entity data in results", () => {
      // Arrange & Act
      const results = getSimilarSitemapMatches({
        sitemap: mockSitemap,
        query: "contact",
      })

      // Assert
      expect(results.length).toBe(1)
      expect(results[0]?.item.entity).toEqual({
        permalink: "https://example.com/contact",
        title: "Contact",
      })
    })
  })

  describe("case insensitivity", () => {
    it("should match regardless of case", () => {
      // Arrange & Act
      const results = getSimilarSitemapMatches({
        sitemap: mockSitemap,
        query: "ABOUT",
      })

      // Assert
      expect(results.length).toBe(1)
      expect(results.map((r) => r.item.entity.permalink)).toEqual([
        "https://example.com/about-us",
      ])
    })

    it("should match mixed case queries", () => {
      // Arrange & Act
      const results = getSimilarSitemapMatches({
        sitemap: mockSitemap,
        query: "HeLLo WoRLd",
      })

      // Assert
      expect(results.length).toBe(1)
      expect(results.map((r) => r.item.entity.permalink)).toEqual([
        "https://example.com/blog/hello-world",
      ])
    })
  })

  describe("sitemap with special URLs", () => {
    it("should handle URLs with query parameters", () => {
      // Arrange
      const sitemapWithParams = [
        { permalink: "https://example.com/page?foo=bar", title: "Page with params" },
      ]

      // Act
      const results = getSimilarSitemapMatches({
        sitemap: sitemapWithParams,
        query: "page",
      })

      // Assert
      expect(results.length).toBe(1)
      expect(results.map((r) => r.item.entity.permalink)).toEqual([
        "https://example.com/page?foo=bar",
      ])
    })

    it("should handle URLs with hash fragments", () => {
      // Arrange
      const sitemapWithHash = [
        { permalink: "https://example.com/page#section", title: "Page with hash" },
      ]

      // Act
      const results = getSimilarSitemapMatches({
        sitemap: sitemapWithHash,
        query: "page",
      })

      // Assert
      expect(results.length).toBe(1)
      expect(results.map((r) => r.item.entity.permalink)).toEqual([
        "https://example.com/page#section",
      ])
    })

    it("should handle URLs with underscores", () => {
      // Arrange
      const sitemapWithUnderscores = [
        { permalink: "https://example.com/my_page_name", title: "Underscore page" },
      ]

      // Act
      const results = getSimilarSitemapMatches({
        sitemap: sitemapWithUnderscores,
        query: "my page name",
      })

      // Assert
      expect(results.length).toBe(1)
      expect(results.map((r) => r.item.entity.permalink)).toEqual([
        "https://example.com/my_page_name",
      ])
    })
  })

  describe("complex URL edge cases", () => {
    it("should handle deeply nested paths", () => {
      // Arrange
      const deeplyNestedSitemap = [
        {
          permalink: "https://example.com/level1/level2/level3/level4/final-page",
          title: "Deep Page",
        },
      ]

      // Act
      const results = getSimilarSitemapMatches({
        sitemap: deeplyNestedSitemap,
        query: "final page",
      })

      // Assert
      expect(results.length).toBe(1)
      expect(results.map((r) => r.item.entity.permalink)).toEqual([
        "https://example.com/level1/level2/level3/level4/final-page",
      ])
    })

    it("should handle URLs with numeric segments", () => {
      // Arrange
      const numericSitemap = [
        {
          permalink: "https://example.com/news/2024/01/15/article",
          title: "Article",
        },
        {
          permalink: "https://example.com/product-123-details",
          title: "Product 123",
        },
        { permalink: "https://example.com/v2/api/users", title: "API V2 Users" },
      ]

      // Act
      const results = getSimilarSitemapMatches({
        sitemap: numericSitemap,
        query: "2024",
      })

      // Assert
      expect(results.length).toBe(1)
      expect(results.map((r) => r.item.entity.permalink)).toEqual([
        "https://example.com/news/2024/01/15/article",
      ])
    })

    it("should handle URLs with file extensions", () => {
      // Arrange
      const extensionSitemap = [
        { permalink: "https://example.com/docs/guide.html", title: "Guide HTML" },
        { permalink: "https://example.com/files/report.pdf", title: "Report PDF" },
        { permalink: "https://example.com/data/export.json", title: "Export JSON" },
      ]

      // Act & Assert
      const results1 = getSimilarSitemapMatches({
        sitemap: extensionSitemap,
        query: "guide",
      })
      expect(results1.length).toBe(1)
      expect(results1.map((r) => r.item.entity.permalink)).toEqual([
        "https://example.com/docs/guide.html",
      ])

      // Act & Assert
      // should not match file extensions
      const results2 = getSimilarSitemapMatches({
        sitemap: extensionSitemap,
        query: "pdf",
      })
      expect(results2.length).toBe(0)
    })

    it("should handle URLs with encoded characters", () => {
      // Arrange
      const encodedSitemap = [
        {
          permalink: "https://example.com/search?q=hello%20world",
          title: "Search Hello World",
        },
        { permalink: "https://example.com/path%2Fto%2Fpage", title: "Encoded Path" },
      ]

      // Assert & Assert
      const results1 = getSimilarSitemapMatches({
        sitemap: encodedSitemap,
        query: "search",
      })
      expect(results1.length).toBe(1)
      expect(results1.map((r) => r.item.entity.permalink)).toEqual([
        "https://example.com/search?q=hello%20world",
      ])

      // Assert & Assert
      // should not match encoded characters
      const results2 = getSimilarSitemapMatches({
        sitemap: encodedSitemap,
        query: "hello world",
      })
      expect(results2.length).toBe(0)
    })

    it("should handle URLs with mixed delimiters and numbers", () => {
      // Arrange
      const mixedSitemap = [
        {
          permalink: "https://example.com/blog-2024_01-my_first_post",
          title: "First Post",
        },
        {
          permalink: "https://example.com/event--2024__annual-meeting",
          title: "Annual Meeting",
        },
      ]

      // Act
      const results = getSimilarSitemapMatches({
        sitemap: mixedSitemap,
        query: "annual meeting",
      })

      // Assert
      expect(results.length).toBe(1)
      expect(results.map((r) => r.item.entity.permalink)).toEqual([
        "https://example.com/event--2024__annual-meeting",
      ])
    })

    it("should handle URLs with trailing slashes", () => {
      // Arrange
      const trailingSlashSitemap = [
        { permalink: "https://example.com/about-us/", title: "About Us" },
        { permalink: "https://example.com/contact/", title: "Contact" },
      ]

      // Act
      const results = getSimilarSitemapMatches({
        sitemap: trailingSlashSitemap,
        query: "about us",
      })

      // Assert
      expect(results.length).toBe(1)
    })

    it("should handle URLs with port numbers", () => {
      // Arrange
      const portSitemap = [
        { permalink: "https://example.com:8080/admin/dashboard", title: "Dashboard" },
        { permalink: "http://localhost:3000/test-page", title: "Test Page" },
      ]

      // Act & Assert
      const results1 = getSimilarSitemapMatches({
        sitemap: portSitemap,
        query: "dashboard",
      })
      expect(results1.length).toBe(1)
      expect(results1.map((r) => r.item.entity.permalink)).toEqual([
        "https://example.com:8080/admin/dashboard",
      ])

      // Act & Assert
      // should not match port numbers
      const results2 = getSimilarSitemapMatches({
        sitemap: portSitemap,
        query: "8080",
      })
      expect(results2.length).toBe(0)
    })

    it("should handle URLs with subdomains", () => {
      // Arrange
      const subdomainSitemap = [
        { permalink: "https://blog.example.com/article-one", title: "Article One" },
        { permalink: "https://api.staging.example.com/docs", title: "API Docs" },
        { permalink: "https://www.example.com/home", title: "Home" },
      ]

      // Act & Assert
      const results1 = getSimilarSitemapMatches({
        sitemap: subdomainSitemap,
        query: "article one",
      })
      expect(results1.length).toBe(1)
      expect(results1.map((r) => r.item.entity.permalink)).toEqual([
        "https://blog.example.com/article-one",
      ])

      // Act & Assert
      // should not match subdomains
      const results2 = getSimilarSitemapMatches({
        sitemap: subdomainSitemap,
        query: "api",
      })
      expect(results2.length).toBe(0)
    })

    it("should handle URLs with query and hash combined", () => {
      // Arrange
      const complexQuerySitemap = [
        {
          permalink: "https://example.com/page?category=news&sort=date#top",
          title: "News Page",
        },
        {
          permalink: "https://example.com/search?q=test&page=1#results",
          title: "Search Results",
        },
      ]

      // Act & Assert
      const results1 = getSimilarSitemapMatches({
        sitemap: complexQuerySitemap,
        query: "page",
      })
      expect(results1.length).toBe(1)
      expect(results1.map((r) => r.item.entity.permalink)).toEqual([
        "https://example.com/page?category=news&sort=date#top",
      ])

      // Act & Assert
      // should not match query parameters
      const results2 = getSimilarSitemapMatches({
        sitemap: complexQuerySitemap,
        query: "news",
      })
      expect(results2.length).toBe(0)
    })

    it("should handle very long path segments", () => {
      // Arrange
      const longPathSitemap = [
        {
          permalink: "https://example.com/this-is-a-very-long-path-segment-that-contains-many-words-and-hyphens",
          title: "Long Path",
        },
      ]

      // Act
      const results = getSimilarSitemapMatches({
        sitemap: longPathSitemap,
        query: "very long path",
      })

      // Assert
      expect(results.length).toBe(1)
    })

    it("should handle URLs with single character segments", () => {
      // Arrange
      const singleCharSitemap = [
        { permalink: "https://example.com/a/b/c/page", title: "ABC Page" },
        { permalink: "https://example.com/x-y-z", title: "XYZ" },
      ]

      // Act
      const results = getSimilarSitemapMatches({
        sitemap: singleCharSitemap,
        query: "x y z",
      })

      // Assert
      expect(results.length).toBe(1)
    })

    it("should handle URLs with consecutive delimiters", () => {
      // Arrange
      const consecutiveDelimiterSitemap = [
        {
          permalink: "https://example.com/path--with---many----dashes",
          title: "Dashes",
        },
        {
          permalink: "https://example.com/path__with___underscores",
          title: "Underscores",
        },
      ]

      // Act
      const results = getSimilarSitemapMatches({
        sitemap: consecutiveDelimiterSitemap,
        query: "path with many dashes",
      })

      // Assert
      expect(results.length).toBe(1)
    })

    it("should handle similar URLs and rank them appropriately", () => {
      // Arrange
      const similarSitemap = [
        { permalink: "https://example.com/contact", title: "Contact" },
        { permalink: "https://example.com/contact-us", title: "Contact Us" },
        { permalink: "https://example.com/contact-form", title: "Contact Form" },
        {
          permalink: "https://example.com/about/contact-info",
          title: "Contact Info",
        },
      ]

      // Act
      const results = getSimilarSitemapMatches({
        sitemap: similarSitemap,
        query: "contact",
      })

      // Assert
      expect(results.length).toBe(4)
      expect(results.map((r) => r.item.entity.permalink)).toEqual([
        "https://example.com/contact",
        "https://example.com/contact-us",
        "https://example.com/contact-form",
        "https://example.com/about/contact-info",
      ])
    })
  })

  describe("normalization with stop words", () => {
    it("should match query with extra stop words to clean sitemap URL", () => {
      // Arrange - query has "is" which is a stop word
      const sitemap = [
        { permalink: "https://example.com/this-my-life", title: "This My Life" },
        { permalink: "https://example.com/other-page", title: "Other Page" },
      ]

      // Act
      const results = getSimilarSitemapMatches({
        sitemap,
        query: "this-is-my-life",
      })

      // Assert - should match despite "is" being in query but not in sitemap
      expect(results.length).toBe(1)
      expect(results[0]?.item.entity.permalink).toBe(
        "https://example.com/this-my-life",
      )
    })

    it("should match query with filler words removed", () => {
      // Arrange
      const sitemap = [
        {
          permalink: "https://example.com/department-finance",
          title: "Department Finance",
        },
        { permalink: "https://example.com/other-page", title: "Other" },
      ]

      // Act - query has "of" which is a stop word
      const results = getSimilarSitemapMatches({
        sitemap,
        query: "department-of-finance",
      })

      // Assert
      expect(results.length).toBe(1)
      expect(results[0]?.item.entity.permalink).toBe(
        "https://example.com/department-finance",
      )
    })

    it("should prefer exact word matches over partial character matches", () => {
      // Arrange
      const sitemap = [
        { permalink: "https://example.com/contact", title: "Contact" },
        { permalink: "https://example.com/contractor", title: "Contractor" },
      ]

      // Act
      const results = getSimilarSitemapMatches({
        sitemap,
        query: "contact",
      })

      // Assert - exact word match should rank first
      expect(results.length).toBe(2)
      expect(results[0]?.item.entity.permalink).toBe(
        "https://example.com/contact",
      )
    })

    it("should rank higher when more query words match", () => {
      // Arrange
      const sitemap = [
        {
          permalink: "https://example.com/web-development",
          title: "Web Development",
        },
        {
          permalink: "https://example.com/web-design-development",
          title: "Web Design Development",
        },
        { permalink: "https://example.com/web", title: "Web" },
      ]

      // Act
      const results = getSimilarSitemapMatches({
        sitemap,
        query: "web development",
      })

      // Assert - exact match should be first
      expect(results[0]?.item.entity.permalink).toBe(
        "https://example.com/web-development",
      )
    })

    it("should handle query with multiple stop words", () => {
      // Arrange
      const sitemap = [
        { permalink: "https://example.com/guide-new-system", title: "Guide" },
        { permalink: "https://example.com/other", title: "Other" },
      ]

      // Act - "a", "to", "the" are all stop words
      const results = getSimilarSitemapMatches({
        sitemap,
        query: "a-guide-to-the-new-system",
      })

      // Assert
      expect(results.length).toBe(1)
      expect(results[0]?.item.entity.permalink).toBe(
        "https://example.com/guide-new-system",
      )
    })

    it("should match URL-encoded queries with stop words", () => {
      // Arrange
      const sitemap = [
        { permalink: "https://example.com/terms-conditions", title: "Terms" },
      ]

      // Act - %20 is space, "and" is stop word
      const results = getSimilarSitemapMatches({
        sitemap,
        query: "terms%20and%20conditions",
      })

      // Assert
      expect(results.length).toBe(1)
      expect(results[0]?.item.entity.permalink).toBe(
        "https://example.com/terms-conditions",
      )
    })

    it("should handle nested paths with stop words in query", () => {
      // Arrange
      const sitemap = [
        { permalink: "https://example.com/about/team/values", title: "Values" },
      ]

      // Act - "the" and "and" are stop words
      const results = getSimilarSitemapMatches({
        sitemap,
        query: "/about/the-team/and-values",
      })

      // Assert
      expect(results.length).toBe(1)
      expect(results[0]?.item.entity.permalink).toBe(
        "https://example.com/about/team/values",
      )
    })

    it("should still find fuzzy matches even with normalized words", () => {
      // Arrange
      const sitemap = [
        { permalink: "https://example.com/services", title: "Services" },
      ]

      // Act - typo in "services"
      const results = getSimilarSitemapMatches({
        sitemap,
        query: "servces",
      })

      // Assert
      expect(results.length).toBe(1)
      expect(results[0]?.item.entity.permalink).toBe(
        "https://example.com/services",
      )
    })
  })

  describe("numberOfResults", () => {
    const largeSitemap = [
      { permalink: "https://example.com/page-1", title: "Page 1" },
      { permalink: "https://example.com/page-2", title: "Page 2" },
      { permalink: "https://example.com/page-3", title: "Page 3" },
      { permalink: "https://example.com/page-4", title: "Page 4" },
      { permalink: "https://example.com/page-5", title: "Page 5" },
      { permalink: "https://example.com/page-6", title: "Page 6" },
      { permalink: "https://example.com/page-7", title: "Page 7" },
      { permalink: "https://example.com/page-8", title: "Page 8" },
    ]

    it("should default to 5 results when numberOfResults is not specified", () => {
      // Arrange & Act
      const results = getSimilarSitemapMatches({
        sitemap: largeSitemap,
        query: "page",
      })

      // Assert
      expect(results.length).toBe(5)
    })

    it("should limit results to the specified numberOfResults", () => {
      // Arrange & Act
      const results = getSimilarSitemapMatches({
        sitemap: largeSitemap,
        query: "page",
        numberOfResults: 3,
      })

      // Assert
      expect(results.length).toBe(3)
    })

    it("should return all matches when numberOfResults exceeds match count", () => {
      // Arrange & Act
      const results = getSimilarSitemapMatches({
        sitemap: largeSitemap,
        query: "page",
        numberOfResults: 20,
      })

      // Assert
      expect(results.length).toBe(8)
    })

    it("should return empty array when numberOfResults is 0", () => {
      // Arrange & Act
      const results = getSimilarSitemapMatches({
        sitemap: largeSitemap,
        query: "page",
        numberOfResults: 0,
      })

      // Assert
      expect(results.length).toBe(0)
    })

    it("should return single result when numberOfResults is 1", () => {
      // Arrange & Act
      const results = getSimilarSitemapMatches({
        sitemap: largeSitemap,
        query: "page",
        numberOfResults: 1,
      })

      // Assert
      expect(results.length).toBe(1)
    })
  })

  describe("word-based fallback", () => {
    it("should fall back to word matching when query has unique characters not in targets", () => {
      // Arrange - query "this not found page" has 'h' and 'i' which don't exist in "not found page"
      // This causes microfuzz to return no results, but word matching should still work
      const sitemap = [
        { permalink: "/not-found-page", title: "Not Found Page" },
        { permalink: "/page-not-found-help", title: "Page Not Found Help" },
        { permalink: "/found-resources", title: "Found Resources" },
        { permalink: "/contact-us", title: "Contact Us" },
      ]

      // Act
      const results = getSimilarSitemapMatches({
        sitemap,
        query: "/this-is-a-not-found-page", // normalizes to "this not found page"
      })

      // Assert - should find matches based on word overlap
      expect(results.length).toBe(3)
      expect(results.map((r) => r.item.entity.permalink)).toEqual([
        "/not-found-page",
        "/page-not-found-help",
        "/found-resources",
      ])
    })

    it("should not return results when word overlap is too low", () => {
      // Arrange - query has no word overlap with sitemap
      const sitemap = [
        { permalink: "/apple-banana", title: "Apple Banana" },
        { permalink: "/orange-grape", title: "Orange Grape" },
      ]

      // Act
      const results = getSimilarSitemapMatches({
        sitemap,
        query: "/completely-different-words",
      })

      // Assert
      expect(results.length).toBe(0)
    })

    it("should rank by word overlap in fallback mode", () => {
      // Arrange
      const sitemap = [
        { permalink: "/found", title: "Found" }, 
        { permalink: "/not-found", title: "Not Found" }, 
        { permalink: "/not-found-page", title: "Not Found Page" }, 
      ]

      // Act - "this not found page" has 4 words after normalization
      const results = getSimilarSitemapMatches({
        sitemap,
        query: "/this-is-a-not-found-page",
      })

      // Assert - should be ranked by word overlap (higher is better)
      expect(results.length).toBe(3)
      expect(results.map((r) => r.item.entity.permalink)).toEqual([
        "/not-found-page", // 3/4 words = 0.6
        "/not-found", // 2/4 words = 0.4 (but union is 4, so 2/4 = 0.5)
        "/found", // 1/4 words = 0.25
      ])
    })
  })
})

