import { describe, expect, it } from "vitest"

import type { AllCardProps } from "~/interfaces"
import { sortCollectionItems } from "../sortCollectionItems"

describe("sortCollectionItems", () => {
  let itemCounter = 0

  const createItem = (overrides?: Partial<AllCardProps>): AllCardProps => {
    itemCounter++
    return {
      id: `test-${itemCounter}`,
      title: "Collection Item",
      date: new Date(),
      lastModified: "2024-12-01T12:00:00Z",
      variant: "article",
      url: "/test-item",
      description: "",
      category: "Category",
      site: {
        siteMap: {
          id: "root",
          title: "Test Site",
          summary: "",
          lastModified: "2024-01-01",
          permalink: "/",
          layout: "homepage",
        },
        siteName: "Test Site",
        theme: "isomer-next",
        url: "https://www.isomer.gov.sg",
        logoUrl: "",
        search: {
          type: "localSearch",
          searchUrl: "/search",
        },
        navbar: { items: [] },
        footerItems: {
          siteNavItems: [],
          privacyStatementLink: "/privacy",
          termsOfUseLink: "/terms",
        },
        lastUpdated: "2024-01-01",
      },
      ...overrides,
    } as AllCardProps
  }

  describe("sortBy is date", () => {
    it("should sort items by the published date (newest first by default)", () => {
      // Arrange
      const items = [
        createItem({ title: "Oldest", date: new Date("2023-01-01") }),
        createItem({ title: "Newest", date: new Date("2023-12-31") }),
        createItem({ title: "Middle", date: new Date("2023-06-15") }),
      ]

      // Act
      const sorted = sortCollectionItems({ items })

      // Assert
      const expectedTitles = ["Newest", "Middle", "Oldest"]
      expect(sorted.map((item) => item.title)).toEqual(expectedTitles)
    })

    it("should sort items by the published date (oldest first), if sort direction is specified as ascending", () => {
      // Arrange
      const items = [
        createItem({ title: "Oldest", date: new Date("2023-01-01") }),
        createItem({ title: "Newest", date: new Date("2023-12-31") }),
        createItem({ title: "Middle", date: new Date("2023-06-15") }),
      ]

      // Act
      const sorted = sortCollectionItems({
        items,
        sortBy: "date",
        sortDirection: "asc",
      })

      // Assert
      const expectedTitles = ["Oldest", "Middle", "Newest"]
      expect(sorted.map((item) => item.title)).toEqual(expectedTitles)
    })

    it("should sort by last modified date when dates are equal", () => {
      // Arrange
      const sameDate = new Date("2023-01-01")
      const items = [
        createItem({
          title: "Charlie",
          date: sameDate,
          lastModified: "2025-01-01T12:00:00Z",
        }),
        createItem({
          title: "Alice",
          date: sameDate,
          lastModified: "2025-03-01T12:00:00Z",
        }),
        createItem({
          title: "Bob",
          date: sameDate,
          lastModified: "2025-02-01T12:00:00Z",
        }),
      ]

      // Act
      const sorted = sortCollectionItems({ items })

      // Assert
      const expectedTitles = ["Alice", "Bob", "Charlie"]
      expect(sorted.map((item) => item.title)).toEqual(expectedTitles)
    })

    it("should sort by title when dates and the last modified dates are equal", () => {
      // Arrange
      const sameDate = new Date("2023-01-01")
      const sameLastUpdated = "2025-01-01T12:00:00Z"
      const items = [
        createItem({
          title: "Charlie",
          date: sameDate,
          lastModified: sameLastUpdated,
        }),
        createItem({
          title: "Alice",
          date: sameDate,
          lastModified: sameLastUpdated,
        }),
        createItem({
          title: "Bob",
          date: sameDate,
          lastModified: sameLastUpdated,
        }),
      ]

      // Act
      const sorted = sortCollectionItems({
        items,
        sortBy: "title",
        sortDirection: "asc",
      })

      // Assert
      const expectedTitles = ["Alice", "Bob", "Charlie"]
      expect(sorted.map((item) => item.title)).toEqual(expectedTitles)
    })

    it("should sort by title when dates are equal and take into account numbers in the title", () => {
      // Arrange
      const sameDate = new Date("2023-01-01")
      const items = [
        createItem({ title: "2 ogpeople", date: sameDate }),
        createItem({ title: "1 ogpeople", date: sameDate }),
        createItem({ title: "10 ogpeople", date: sameDate }),
      ]

      // Act
      const sorted = sortCollectionItems({
        items,
        sortBy: "title",
        sortDirection: "desc",
      })

      // Assert
      const expectedTitles = ["10 ogpeople", "2 ogpeople", "1 ogpeople"]
      expect(sorted.map((item) => item.title)).toEqual(expectedTitles)
    })

    it("should sort by title if articles do not have a published date", () => {
      // Arrange
      const items = [
        createItem({ title: "Charlie", date: undefined }),
        createItem({ title: "Alice", date: undefined }),
        createItem({ title: "Bob", date: undefined }),
      ]

      // Act
      const sorted = sortCollectionItems({
        items,
        sortBy: "title",
        sortDirection: "asc",
      })

      // Assert
      const expectedTitles = ["Alice", "Bob", "Charlie"]
      expect(sorted.map((item) => item.title)).toEqual(expectedTitles)
    })

    it("should sort by last modified date if articles do not have a published date and titles are the same", () => {
      // Arrange
      const items = [
        createItem({
          title: "Same Title",
          date: undefined,
          lastModified: "2025-01-01T12:00:00Z",
        }),
        createItem({
          title: "Same Title",
          date: undefined,
          lastModified: "2025-03-01T12:00:00Z",
        }),
        createItem({
          title: "Same Title",
          date: undefined,
          lastModified: "2025-02-01T12:00:00Z",
        }),
      ]

      // Act
      const sorted = sortCollectionItems({ items })

      // Assert
      const expectedLastModified = [
        "2025-03-01T12:00:00Z",
        "2025-02-01T12:00:00Z",
        "2025-01-01T12:00:00Z",
      ]
      expect(sorted.map((item) => item.lastModified)).toEqual(
        expectedLastModified,
      )
    })

    it("should sort items with published dates before items without published dates, sorted alphabetically by title", () => {
      // Arrange
      const items = [
        createItem({ title: "No Date", date: undefined }),
        createItem({ title: "Newest", date: new Date("2023-12-31") }),
        createItem({ title: "Also No Date", date: undefined }),
        createItem({ title: "Oldest", date: new Date("2023-01-01") }),
      ]

      // Act
      const sorted = sortCollectionItems({ items, sortBy: "date" })

      // Assert
      const expectedTitles = ["Newest", "Oldest", "Also No Date", "No Date"]
      expect(sorted.map((item) => item.title)).toEqual(expectedTitles)
    })
  })

  describe("sortBy is title", () => {
    it("should sort items by title (alphabetically) by default", () => {
      // Arrange
      const items = [
        createItem({ title: "Charlie" }),
        createItem({ title: "Alice" }),
        createItem({ title: "Bob" }),
      ]

      // Act
      const sorted = sortCollectionItems({
        items,
        sortBy: "title",
      })

      // Assert
      const expectedTitles = ["Alice", "Bob", "Charlie"]
      expect(sorted.map((item) => item.title)).toEqual(expectedTitles)
    })

    it("should sort items by title (reverse alphabetically) when sort direction is descending", () => {
      // Arrange
      const items = [
        createItem({ title: "Charlie" }),
        createItem({ title: "Alice" }),
        createItem({ title: "Bob" }),
      ]

      // Act
      const sorted = sortCollectionItems({
        items,
        sortBy: "title",
        sortDirection: "desc",
      })

      // Assert
      const expectedTitles = ["Charlie", "Bob", "Alice"]
      expect(sorted.map((item) => item.title)).toEqual(expectedTitles)
    })

    it("should sort items by published date (oldest first) when titles are the same", () => {
      // Arrange
      const items = [
        createItem({ title: "Same Title", date: new Date("2023-01-01") }),
        createItem({ title: "Same Title", date: new Date("2023-12-31") }),
        createItem({ title: "Same Title", date: new Date("2023-06-15") }),
      ]

      // Act
      const sorted = sortCollectionItems({
        items,
        sortBy: "title",
      })

      // Assert
      const expectedDates = [
        new Date("2023-01-01"),
        new Date("2023-06-15"),
        new Date("2023-12-31"),
      ]
      expect(sorted.map((item) => item.date)).toEqual(expectedDates)
    })

    it("should sort items by published date (oldest first) when titles are the same and sort direction is ascending", () => {
      // Arrange
      const items = [
        createItem({ title: "Same Title", date: new Date("2023-01-01") }),
        createItem({ title: "Same Title", date: new Date("2023-12-31") }),
        createItem({ title: "Same Title", date: new Date("2023-06-15") }),
      ]

      // Act
      const sorted = sortCollectionItems({
        items,
        sortBy: "title",
        sortDirection: "asc",
      })

      // Assert
      const expectedDates = [
        new Date("2023-01-01"),
        new Date("2023-06-15"),
        new Date("2023-12-31"),
      ]
      expect(sorted.map((item) => item.date)).toEqual(expectedDates)
    })

    it("should sort items by title and take into account numbers in the title", () => {
      // Arrange
      const items = [
        createItem({ title: "2 ogpeople" }),
        createItem({ title: "1 ogpeople" }),
        createItem({ title: "10 ogpeople" }),
      ]

      // Act
      const sorted = sortCollectionItems({
        items,
        sortBy: "title",
        sortDirection: "asc",
      })

      // Assert
      const expectedTitles = ["1 ogpeople", "2 ogpeople", "10 ogpeople"]
      expect(sorted.map((item) => item.title)).toEqual(expectedTitles)
    })

    it("should sort items by last modified in ascending order if the titles are the same and they do not have published dates", () => {
      // Arrange
      const items = [
        createItem({
          title: "Same Title",
          date: undefined,
          lastModified: "2025-01-01T12:00:00Z",
        }),
        createItem({
          title: "Same Title",
          date: undefined,
          lastModified: "2025-03-01T12:00:00Z",
        }),
        createItem({
          title: "Same Title",
          date: undefined,
          lastModified: "2025-02-01T12:00:00Z",
        }),
      ]

      // Act
      const sorted = sortCollectionItems({
        items,
        sortBy: "title",
        sortDirection: "asc",
      })

      // Assert
      const expectedLastModified = [
        "2025-01-01T12:00:00Z",
        "2025-02-01T12:00:00Z",
        "2025-03-01T12:00:00Z",
      ]
      expect(sorted.map((item) => item.lastModified)).toEqual(
        expectedLastModified,
      )
    })

    it("should sort items with published dates before items without published dates when they all have the same title", () => {
      // Arrange
      const items = [
        createItem({ title: "Same title", date: undefined }),
        createItem({ title: "Same title", date: new Date("2023-12-31") }),
        createItem({ title: "Same title", date: undefined }),
        createItem({ title: "Same title", date: new Date("2023-01-01") }),
      ]

      // Act
      const sorted = sortCollectionItems({ items, sortBy: "title" })

      // Assert
      const expectedDates = [
        new Date("2023-01-01"),
        new Date("2023-12-31"),
        undefined,
        undefined,
      ]
      expect(sorted.map((item) => item.date)).toEqual(expectedDates)
    })
  })

  describe("sortBy is category", () => {
    it("should sort items by category (alphabetically) by default", () => {
      // Arrange
      const items = [
        createItem({ category: "2000" }),
        createItem({ category: "2002" }),
        createItem({ category: "2001" }),
      ]

      // Act
      const sorted = sortCollectionItems({
        items,
        sortBy: "category",
      })

      // Assert
      const expectedCategories = ["2000", "2001", "2002"]
      expect(sorted.map((item) => item.category)).toEqual(expectedCategories)
    })

    it("should sort items by category (reverse alphabetically) when sort direction is descending", () => {
      // Arrange
      const items = [
        createItem({ category: "2000" }),
        createItem({ category: "2002" }),
        createItem({ category: "2001" }),
      ]

      // Act
      const sorted = sortCollectionItems({
        items,
        sortBy: "category",
        sortDirection: "desc",
      })

      // Assert
      const expectedCategories = ["2002", "2001", "2000"]
      expect(sorted.map((item) => item.category)).toEqual(expectedCategories)
    })

    it("should sort items by title when categories are the same", () => {
      // Arrange
      const items = [
        createItem({ category: "Same Category", title: "Charlie" }),
        createItem({ category: "Same Category", title: "Alice" }),
        createItem({ category: "Same Category", title: "Bob" }),
      ]

      // Act
      const sorted = sortCollectionItems({
        items,
        sortBy: "category",
      })

      // Assert
      const expectedTitles = ["Alice", "Bob", "Charlie"]
      expect(sorted.map((item) => item.title)).toEqual(expectedTitles)
    })

    it("should sort items by published date (oldest first) when categories and titles are the same", () => {
      // Arrange
      const items = [
        createItem({
          category: "Same Category",
          title: "Same Title",
          date: new Date("2023-01-01"),
        }),
        createItem({
          category: "Same Category",
          title: "Same Title",
          date: new Date("2023-12-31"),
        }),
        createItem({
          category: "Same Category",
          title: "Same Title",
          date: new Date("2023-06-15"),
        }),
      ]

      // Act
      const sorted = sortCollectionItems({
        items,
        sortBy: "category",
      })

      // Assert
      const expectedDates = [
        new Date("2023-01-01"),
        new Date("2023-06-15"),
        new Date("2023-12-31"),
      ]
      expect(sorted.map((item) => item.date)).toEqual(expectedDates)
    })

    it("should sort items by title and take into account numbers in the title when categories are the same", () => {
      // Arrange
      const items = [
        createItem({ category: "Same Category", title: "2 ogpeople" }),
        createItem({ category: "Same Category", title: "1 ogpeople" }),
        createItem({ category: "Same Category", title: "10 ogpeople" }),
      ]

      // Act
      const sorted = sortCollectionItems({
        items,
        sortBy: "category",
      })

      // Assert
      const expectedTitles = ["1 ogpeople", "2 ogpeople", "10 ogpeople"]
      expect(sorted.map((item) => item.title)).toEqual(expectedTitles)
    })

    it("should sort items by last modified in ascending order if the categories and titles are the same and they do not have published dates", () => {
      // Arrange
      const items = [
        createItem({
          category: "Same Category",
          title: "Same Title",
          date: undefined,
          lastModified: "2025-01-01T12:00:00Z",
        }),
        createItem({
          category: "Same Category",
          title: "Same Title",
          date: undefined,
          lastModified: "2025-03-01T12:00:00Z",
        }),
        createItem({
          category: "Same Category",
          title: "Same Title",
          date: undefined,
          lastModified: "2025-02-01T12:00:00Z",
        }),
      ]

      // Act
      const sorted = sortCollectionItems({
        items,
        sortBy: "category",
      })

      // Assert
      const expectedLastModified = [
        "2025-01-01T12:00:00Z",
        "2025-02-01T12:00:00Z",
        "2025-03-01T12:00:00Z",
      ]
      expect(sorted.map((item) => item.lastModified)).toEqual(
        expectedLastModified,
      )
    })

    it("should sort items with published dates before items without published dates when they all have the same category", () => {
      // Arrange
      const items = [
        createItem({ category: "Same Category", date: undefined }),
        createItem({ category: "Same Category", date: new Date("2023-12-31") }),
        createItem({ category: "Same Category", date: undefined }),
        createItem({ category: "Same Category", date: new Date("2023-01-01") }),
      ]

      // Act
      const sorted = sortCollectionItems({
        items,
        sortBy: "category",
      })

      // Assert
      const expectedDates = [
        new Date("2023-01-01"),
        new Date("2023-12-31"),
        undefined,
        undefined,
      ]
      expect(sorted.map((item) => item.date)).toEqual(expectedDates)
    })
  })
})
