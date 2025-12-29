import { describe, expect, it } from "vitest"

import { getFuzzySitemapMatches } from "../getFuzzySitemapMatches"

describe("getFuzzySitemapMatches", () => {
  const mockSitemap = [
    { url: "https://example.com/about-us", title: "About Us" },
    { url: "https://example.com/contact", title: "Contact" },
    {
      url: "https://example.com/services/web-development",
      title: "Web Development",
    },
    { url: "https://example.com/services/mobile-apps", title: "Mobile Apps" },
    { url: "https://example.com/blog/hello-world", title: "Hello World" },
  ]

  describe("basic functionality", () => {
    it("should find exact matches when searching", () => {
      // Arrange & Act
      const results = getFuzzySitemapMatches({
        sitemap: mockSitemap,
        query: "about",
      })

      // Assert
      expect(results.length).toBe(1)
      expect(results.map((r) => r.item.entity.url)).toEqual([
        "https://example.com/about-us",
      ])
    })

    it("should find fuzzy matches when searching", () => {
      // Arrange & Act
      const results = getFuzzySitemapMatches({
        sitemap: mockSitemap,
        query: "contct",
      })

      // Assert
      expect(results.length).toBe(1)
      expect(results.map((r) => r.item.entity.url)).toEqual([
        "https://example.com/contact",
      ])
    })
  })

  describe("URL normalization in matching", () => {
    it("should match URLs with hyphens converted to spaces", () => {
      // Arrange & Act
      const results = getFuzzySitemapMatches({
        sitemap: mockSitemap,
        query: "about us",
      })

      // Assert
      expect(results.length).toBe(1)
      expect(results.map((r) => r.item.entity.url)).toEqual([
        "https://example.com/about-us",
      ])
    })

    it("should match nested paths", () => {
      // Arrange & Act
      const results = getFuzzySitemapMatches({
        sitemap: mockSitemap,
        query: "web development",
      })

      // Assert
      expect(results.length).toBe(1)
      expect(results.map((r) => r.item.entity.url)).toEqual([
        "https://example.com/services/web-development",
      ])
    })

    it("should match partial path segments", () => {
      // Arrange & Act
      const results = getFuzzySitemapMatches({
        sitemap: mockSitemap,
        query: "services",
      })

      // Assert
      expect(results.length).toBe(2)
      expect(results.map((r) => r.item.entity.url)).toEqual([
        "https://example.com/services/web-development",
        "https://example.com/services/mobile-apps",
      ])
    })
  })

  describe("edge cases", () => {
    it("should handle empty sitemap", () => {
      // Arrange & Act
      const results = getFuzzySitemapMatches({
        sitemap: [],
        query: "test",
      })

      // Assert
      expect(results.length).toBe(0)
    })

    it("should handle empty query", () => {
      // Arrange & Act
      const results = getFuzzySitemapMatches({
        sitemap: mockSitemap,
        query: "",
      })

      // Assert
      expect(results.length).toBe(0)
    })

    it("should handle query with no matches", () => {
      // Arrange & Act
      const results = getFuzzySitemapMatches({
        sitemap: mockSitemap,
        query: "zzzznonexistent",
      })

      // Assert
      expect(results.length).toBe(0)
    })

    it("should preserve entity data in results", () => {
      // Arrange & Act
      const results = getFuzzySitemapMatches({
        sitemap: mockSitemap,
        query: "contact",
      })

      // Assert
      expect(results.length).toBe(1)
      expect(results[0]?.item.entity).toEqual({
        url: "https://example.com/contact",
        title: "Contact",
      })
    })
  })

  describe("case insensitivity", () => {
    it("should match regardless of case", () => {
      // Arrange & Act
      const results = getFuzzySitemapMatches({
        sitemap: mockSitemap,
        query: "ABOUT",
      })

      // Assert
      expect(results.length).toBe(1)
      expect(results.map((r) => r.item.entity.url)).toEqual([
        "https://example.com/about-us",
      ])
    })

    it("should match mixed case queries", () => {
      // Arrange & Act
      const results = getFuzzySitemapMatches({
        sitemap: mockSitemap,
        query: "HeLLo WoRLd",
      })

      // Assert
      expect(results.length).toBe(1)
      expect(results.map((r) => r.item.entity.url)).toEqual([
        "https://example.com/blog/hello-world",
      ])
    })
  })

  describe("sitemap with special URLs", () => {
    it("should handle URLs with query parameters", () => {
      // Arrange
      const sitemapWithParams = [
        { url: "https://example.com/page?foo=bar", title: "Page with params" },
      ]

      // Act
      const results = getFuzzySitemapMatches({
        sitemap: sitemapWithParams,
        query: "page",
      })

      // Assert
      expect(results.length).toBe(1)
      expect(results.map((r) => r.item.entity.url)).toEqual([
        "https://example.com/page?foo=bar",
      ])
    })

    it("should handle URLs with hash fragments", () => {
      // Arrange
      const sitemapWithHash = [
        { url: "https://example.com/page#section", title: "Page with hash" },
      ]

      // Act
      const results = getFuzzySitemapMatches({
        sitemap: sitemapWithHash,
        query: "page",
      })

      // Assert
      expect(results.length).toBe(1)
      expect(results.map((r) => r.item.entity.url)).toEqual([
        "https://example.com/page#section",
      ])
    })

    it("should handle URLs with underscores", () => {
      // Arrange
      const sitemapWithUnderscores = [
        { url: "https://example.com/my_page_name", title: "Underscore page" },
      ]

      // Act
      const results = getFuzzySitemapMatches({
        sitemap: sitemapWithUnderscores,
        query: "my page name",
      })

      // Assert
      expect(results.length).toBe(1)
      expect(results.map((r) => r.item.entity.url)).toEqual([
        "https://example.com/my_page_name",
      ])
    })
  })

  describe("complex URL edge cases", () => {
    it("should handle deeply nested paths", () => {
      // Arrange
      const deeplyNestedSitemap = [
        {
          url: "https://example.com/level1/level2/level3/level4/final-page",
          title: "Deep Page",
        },
      ]

      // Act
      const results = getFuzzySitemapMatches({
        sitemap: deeplyNestedSitemap,
        query: "final page",
      })

      // Assert
      expect(results.length).toBe(1)
      expect(results.map((r) => r.item.entity.url)).toEqual([
        "https://example.com/level1/level2/level3/level4/final-page",
      ])
    })

    it("should handle URLs with numeric segments", () => {
      // Arrange
      const numericSitemap = [
        {
          url: "https://example.com/news/2024/01/15/article",
          title: "Article",
        },
        {
          url: "https://example.com/product-123-details",
          title: "Product 123",
        },
        { url: "https://example.com/v2/api/users", title: "API V2 Users" },
      ]

      // Act
      const results = getFuzzySitemapMatches({
        sitemap: numericSitemap,
        query: "2024",
      })

      // Assert
      expect(results.length).toBe(1)
      expect(results.map((r) => r.item.entity.url)).toEqual([
        "https://example.com/news/2024/01/15/article",
      ])
    })

    it("should handle URLs with file extensions", () => {
      // Arrange
      const extensionSitemap = [
        { url: "https://example.com/docs/guide.html", title: "Guide HTML" },
        { url: "https://example.com/files/report.pdf", title: "Report PDF" },
        { url: "https://example.com/data/export.json", title: "Export JSON" },
      ]

      // Act & Assert
      const results1 = getFuzzySitemapMatches({
        sitemap: extensionSitemap,
        query: "guide",
      })
      expect(results1.length).toBe(1)
      expect(results1.map((r) => r.item.entity.url)).toEqual([
        "https://example.com/docs/guide.html",
      ])

      // Act & Assert
      // should not match file extensions
      const results2 = getFuzzySitemapMatches({
        sitemap: extensionSitemap,
        query: "pdf",
      })
      expect(results2.length).toBe(0)
    })

    it("should handle URLs with encoded characters", () => {
      // Arrange
      const encodedSitemap = [
        {
          url: "https://example.com/search?q=hello%20world",
          title: "Search Hello World",
        },
        { url: "https://example.com/path%2Fto%2Fpage", title: "Encoded Path" },
      ]

      // Assert & Assert
      const results1 = getFuzzySitemapMatches({
        sitemap: encodedSitemap,
        query: "search",
      })
      expect(results1.length).toBe(1)
      expect(results1.map((r) => r.item.entity.url)).toEqual([
        "https://example.com/search?q=hello%20world",
      ])

      // Assert & Assert
      // should not match encoded characters
      const results2 = getFuzzySitemapMatches({
        sitemap: encodedSitemap,
        query: "hello world",
      })
      expect(results2.length).toBe(0)
    })

    it("should handle URLs with mixed delimiters and numbers", () => {
      // Arrange
      const mixedSitemap = [
        {
          url: "https://example.com/blog-2024_01-my_first_post",
          title: "First Post",
        },
        {
          url: "https://example.com/event--2024__annual-meeting",
          title: "Annual Meeting",
        },
      ]

      // Act
      const results = getFuzzySitemapMatches({
        sitemap: mixedSitemap,
        query: "annual meeting",
      })

      // Assert
      expect(results.length).toBe(1)
      expect(results.map((r) => r.item.entity.url)).toEqual([
        "https://example.com/event--2024__annual-meeting",
      ])
    })

    it("should handle URLs with trailing slashes", () => {
      // Arrange
      const trailingSlashSitemap = [
        { url: "https://example.com/about-us/", title: "About Us" },
        { url: "https://example.com/contact/", title: "Contact" },
      ]

      // Act
      const results = getFuzzySitemapMatches({
        sitemap: trailingSlashSitemap,
        query: "about us",
      })

      // Assert
      expect(results.length).toBe(1)
    })

    it("should handle URLs with port numbers", () => {
      // Arrange
      const portSitemap = [
        { url: "https://example.com:8080/admin/dashboard", title: "Dashboard" },
        { url: "http://localhost:3000/test-page", title: "Test Page" },
      ]

      // Act & Assert
      const results1 = getFuzzySitemapMatches({
        sitemap: portSitemap,
        query: "dashboard",
      })
      expect(results1.length).toBe(1)
      expect(results1.map((r) => r.item.entity.url)).toEqual([
        "https://example.com:8080/admin/dashboard",
      ])

      // Act & Assert
      // should not match port numbers
      const results2 = getFuzzySitemapMatches({
        sitemap: portSitemap,
        query: "8080",
      })
      expect(results2.length).toBe(0)
    })

    it("should handle URLs with subdomains", () => {
      // Arrange
      const subdomainSitemap = [
        { url: "https://blog.example.com/article-one", title: "Article One" },
        { url: "https://api.staging.example.com/docs", title: "API Docs" },
        { url: "https://www.example.com/home", title: "Home" },
      ]

      // Act & Assert
      const results1 = getFuzzySitemapMatches({
        sitemap: subdomainSitemap,
        query: "article one",
      })
      expect(results1.length).toBe(1)
      expect(results1.map((r) => r.item.entity.url)).toEqual([
        "https://blog.example.com/article-one",
      ])

      // Act & Assert
      // should not match subdomains
      const results2 = getFuzzySitemapMatches({
        sitemap: subdomainSitemap,
        query: "api",
      })
      expect(results2.length).toBe(0)
    })

    it("should handle URLs with query and hash combined", () => {
      // Arrange
      const complexQuerySitemap = [
        {
          url: "https://example.com/page?category=news&sort=date#top",
          title: "News Page",
        },
        {
          url: "https://example.com/search?q=test&page=1#results",
          title: "Search Results",
        },
      ]

      // Act & Assert
      const results1 = getFuzzySitemapMatches({
        sitemap: complexQuerySitemap,
        query: "page",
      })
      expect(results1.length).toBe(1)
      expect(results1.map((r) => r.item.entity.url)).toEqual([
        "https://example.com/page?category=news&sort=date#top",
      ])

      // Act & Assert
      // should not match query parameters
      const results2 = getFuzzySitemapMatches({
        sitemap: complexQuerySitemap,
        query: "news",
      })
      expect(results2.length).toBe(0)
    })

    it("should handle very long path segments", () => {
      // Arrange
      const longPathSitemap = [
        {
          url: "https://example.com/this-is-a-very-long-path-segment-that-contains-many-words-and-hyphens",
          title: "Long Path",
        },
      ]

      // Act
      const results = getFuzzySitemapMatches({
        sitemap: longPathSitemap,
        query: "very long path",
      })

      // Assert
      expect(results.length).toBe(1)
    })

    it("should handle URLs with single character segments", () => {
      // Arrange
      const singleCharSitemap = [
        { url: "https://example.com/a/b/c/page", title: "ABC Page" },
        { url: "https://example.com/x-y-z", title: "XYZ" },
      ]

      // Act
      const results = getFuzzySitemapMatches({
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
          url: "https://example.com/path--with---many----dashes",
          title: "Dashes",
        },
        {
          url: "https://example.com/path__with___underscores",
          title: "Underscores",
        },
      ]

      // Act
      const results = getFuzzySitemapMatches({
        sitemap: consecutiveDelimiterSitemap,
        query: "path with many dashes",
      })

      // Assert
      expect(results.length).toBe(1)
    })

    it("should handle similar URLs and rank them appropriately", () => {
      // Arrange
      const similarSitemap = [
        { url: "https://example.com/contact", title: "Contact" },
        { url: "https://example.com/contact-us", title: "Contact Us" },
        { url: "https://example.com/contact-form", title: "Contact Form" },
        {
          url: "https://example.com/about/contact-info",
          title: "Contact Info",
        },
      ]

      // Act
      const results = getFuzzySitemapMatches({
        sitemap: similarSitemap,
        query: "contact",
      })

      // Assert
      expect(results.length).toBe(4)
      expect(results.map((r) => r.item.entity.url)).toEqual([
        "https://example.com/contact",
        "https://example.com/contact-us",
        "https://example.com/contact-form",
        "https://example.com/about/contact-info",
      ])
    })
  })

  describe("numberOfResults", () => {
    const largeSitemap = [
      { url: "https://example.com/page-1", title: "Page 1" },
      { url: "https://example.com/page-2", title: "Page 2" },
      { url: "https://example.com/page-3", title: "Page 3" },
      { url: "https://example.com/page-4", title: "Page 4" },
      { url: "https://example.com/page-5", title: "Page 5" },
      { url: "https://example.com/page-6", title: "Page 6" },
      { url: "https://example.com/page-7", title: "Page 7" },
      { url: "https://example.com/page-8", title: "Page 8" },
    ]

    it("should default to 5 results when numberOfResults is not specified", () => {
      // Arrange & Act
      const results = getFuzzySitemapMatches({
        sitemap: largeSitemap,
        query: "page",
      })

      // Assert
      expect(results.length).toBe(5)
    })

    it("should limit results to the specified numberOfResults", () => {
      // Arrange & Act
      const results = getFuzzySitemapMatches({
        sitemap: largeSitemap,
        query: "page",
        numberOfResults: 3,
      })

      // Assert
      expect(results.length).toBe(3)
    })

    it("should return all matches when numberOfResults exceeds match count", () => {
      // Arrange & Act
      const results = getFuzzySitemapMatches({
        sitemap: largeSitemap,
        query: "page",
        numberOfResults: 20,
      })

      // Assert
      expect(results.length).toBe(8)
    })

    it("should return empty array when numberOfResults is 0", () => {
      // Arrange & Act
      const results = getFuzzySitemapMatches({
        sitemap: largeSitemap,
        query: "page",
        numberOfResults: 0,
      })

      // Assert
      expect(results.length).toBe(0)
    })

    it("should return single result when numberOfResults is 1", () => {
      // Arrange & Act
      const results = getFuzzySitemapMatches({
        sitemap: largeSitemap,
        query: "page",
        numberOfResults: 1,
      })

      // Assert
      expect(results.length).toBe(1)
    })
  })
})
