import type { AllCardProps } from "~/interfaces"
import { describe, expect, it } from "vitest"

import { sortCollectionItems } from "../sortCollectionItems"

describe("sortCollectionItems", () => {
  let itemCounter = 0

  const createItem = (overrides?: Partial<AllCardProps>): AllCardProps => {
    itemCounter++
    const item = {
      date: new Date(),
      description: "",
      id: `test-${itemCounter}`,
      lastModified: "2024-12-01T12:00:00Z",
      plaintextTags: [{ category: "Category", selected: ["Category"] }],
      site: {
        footerItems: {
          privacyStatementLink: "/privacy",
          siteNavItems: [],
          termsOfUseLink: "/terms",
        },
        lastUpdated: "2024-01-01",
        logoUrl: "",
        navbar: { items: [] },
        search: {
          searchUrl: "/search",
          type: "localSearch",
        },
        siteMap: {
          id: "root",
          lastModified: "2024-01-01",
          layout: "homepage",
          permalink: "/",
          summary: "",
          title: "Test Site",
        },
        siteName: "Test Site",
        theme: "isomer-next",
        url: "https://www.isomer.gov.sg",
      },
      title: "Collection Item",
      url: "/test-item",
      variant: "article",
      ...overrides,
    }
    // SAFETY: test fixture builds a minimal collection card item
    return item as AllCardProps
  }

  describe("sortBy is date", () => {
    it("should sort items by the published date (newest first by default)", () => {
      // Arrange
      const items = [
        createItem({ date: new Date("2023-01-01"), title: "Oldest" }),
        createItem({ date: new Date("2023-12-31"), title: "Newest" }),
        createItem({ date: new Date("2023-06-15"), title: "Middle" }),
      ]

      // Act
      const sorted = sortCollectionItems({ items })
      const sortedTwo = sortCollectionItems({
        items,
        sortOrder: "date-desc",
      })

      // Assert
      const expectedTitles = ["Newest", "Middle", "Oldest"]
      expect(sorted.map((item) => item.title)).toEqual(expectedTitles)
      expect(sortedTwo.map((item) => item.title)).toEqual(expectedTitles)
    })

    it("should sort items by the published date (oldest first), if sort direction is specified as ascending", () => {
      // Arrange
      const items = [
        createItem({ date: new Date("2023-01-01"), title: "Oldest" }),
        createItem({ date: new Date("2023-12-31"), title: "Newest" }),
        createItem({ date: new Date("2023-06-15"), title: "Middle" }),
      ]

      // Act
      const sorted = sortCollectionItems({
        items,
        sortBy: "date",
        sortDirection: "asc",
      })
      const sortedTwo = sortCollectionItems({
        items,
        sortOrder: "date-asc",
      })

      // Assert
      const expectedTitles = ["Oldest", "Middle", "Newest"]
      expect(sorted.map((item) => item.title)).toEqual(expectedTitles)
      expect(sortedTwo.map((item) => item.title)).toEqual(expectedTitles)
    })

    it("should sort by last modified date when dates are equal", () => {
      // Arrange
      const sameDate = new Date("2023-01-01")
      const items = [
        createItem({
          date: sameDate,
          lastModified: "2025-01-01T12:00:00Z",
          title: "Charlie",
        }),
        createItem({
          date: sameDate,
          lastModified: "2025-03-01T12:00:00Z",
          title: "Alice",
        }),
        createItem({
          date: sameDate,
          lastModified: "2025-02-01T12:00:00Z",
          title: "Bob",
        }),
      ]

      // Act
      const sorted = sortCollectionItems({ items })
      const sortedTwo = sortCollectionItems({
        items,
        sortOrder: "date-desc",
      })

      // Assert
      const expectedTitles = ["Alice", "Bob", "Charlie"]
      expect(sorted.map((item) => item.title)).toEqual(expectedTitles)
      expect(sortedTwo.map((item) => item.title)).toEqual(expectedTitles)
    })

    it("should sort by title when dates and the last modified dates are equal", () => {
      // Arrange
      const sameDate = new Date("2023-01-01")
      const sameLastUpdated = "2025-01-01T12:00:00Z"
      const items = [
        createItem({
          date: sameDate,
          lastModified: sameLastUpdated,
          title: "Charlie",
        }),
        createItem({
          date: sameDate,
          lastModified: sameLastUpdated,
          title: "Alice",
        }),
        createItem({
          date: sameDate,
          lastModified: sameLastUpdated,
          title: "Bob",
        }),
      ]

      // Act
      const sorted = sortCollectionItems({
        items,
        sortBy: "title",
        sortDirection: "asc",
      })
      const sortedTwo = sortCollectionItems({
        items,
        sortOrder: "title-asc",
      })

      // Assert
      const expectedTitles = ["Alice", "Bob", "Charlie"]
      expect(sorted.map((item) => item.title)).toEqual(expectedTitles)
      expect(sortedTwo.map((item) => item.title)).toEqual(expectedTitles)
    })

    it("should sort by title when dates are equal and take into account numbers in the title", () => {
      // Arrange
      const sameDate = new Date("2023-01-01")
      const items = [
        createItem({ date: sameDate, title: "2 ogpeople" }),
        createItem({ date: sameDate, title: "1 ogpeople" }),
        createItem({ date: sameDate, title: "10 ogpeople" }),
      ]

      // Act
      const sorted = sortCollectionItems({
        items,
        sortBy: "title",
        sortDirection: "desc",
      })
      const sortedTwo = sortCollectionItems({
        items,
        sortOrder: "title-desc",
      })

      // Assert
      const expectedTitles = ["10 ogpeople", "2 ogpeople", "1 ogpeople"]
      expect(sorted.map((item) => item.title)).toEqual(expectedTitles)
      expect(sortedTwo.map((item) => item.title)).toEqual(expectedTitles)
    })

    it("should sort by title if articles do not have a published date", () => {
      // Arrange
      const items = [
        createItem({ date: undefined, title: "Charlie" }),
        createItem({ date: undefined, title: "Alice" }),
        createItem({ date: undefined, title: "Bob" }),
      ]

      // Act
      const sorted = sortCollectionItems({
        items,
        sortBy: "title",
        sortDirection: "asc",
      })
      const sortedTwo = sortCollectionItems({
        items,
        sortOrder: "title-asc",
      })

      // Assert
      const expectedTitles = ["Alice", "Bob", "Charlie"]
      expect(sorted.map((item) => item.title)).toEqual(expectedTitles)
      expect(sortedTwo.map((item) => item.title)).toEqual(expectedTitles)
    })

    it("should sort by last modified date if articles do not have a published date and titles are the same", () => {
      // Arrange
      const items = [
        createItem({
          date: undefined,
          lastModified: "2025-01-01T12:00:00Z",
          title: "Same Title",
        }),
        createItem({
          date: undefined,
          lastModified: "2025-03-01T12:00:00Z",
          title: "Same Title",
        }),
        createItem({
          date: undefined,
          lastModified: "2025-02-01T12:00:00Z",
          title: "Same Title",
        }),
      ]

      // Act
      const sorted = sortCollectionItems({ items })
      const sortedTwo = sortCollectionItems({
        items,
        sortOrder: "date-desc",
      })

      // Assert
      const expectedLastModified = [
        "2025-03-01T12:00:00Z",
        "2025-02-01T12:00:00Z",
        "2025-01-01T12:00:00Z",
      ]
      expect(sorted.map((item) => item.lastModified)).toEqual(
        expectedLastModified,
      )
      expect(sortedTwo.map((item) => item.lastModified)).toEqual(
        expectedLastModified,
      )
    })

    it("should sort items with published dates before items without published dates, sorted alphabetically by title", () => {
      // Arrange
      const items = [
        createItem({ date: undefined, title: "No Date" }),
        createItem({ date: new Date("2023-12-31"), title: "Newest" }),
        createItem({ date: undefined, title: "Also No Date" }),
        createItem({ date: new Date("2023-01-01"), title: "Oldest" }),
      ]

      // Act
      const sorted = sortCollectionItems({ items, sortBy: "date" })
      const sortedTwo = sortCollectionItems({
        items,
        sortOrder: "date-desc",
      })

      // Assert
      const expectedTitles = ["Newest", "Oldest", "Also No Date", "No Date"]
      expect(sorted.map((item) => item.title)).toEqual(expectedTitles)
      expect(sortedTwo.map((item) => item.title)).toEqual(expectedTitles)
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
      const sortedTwo = sortCollectionItems({
        items,
        sortOrder: "title-asc",
      })

      // Assert
      const expectedTitles = ["Alice", "Bob", "Charlie"]
      expect(sorted.map((item) => item.title)).toEqual(expectedTitles)
      expect(sortedTwo.map((item) => item.title)).toEqual(expectedTitles)
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
      const sortedTwo = sortCollectionItems({
        items,
        sortOrder: "title-desc",
      })

      // Assert
      const expectedTitles = ["Charlie", "Bob", "Alice"]
      expect(sorted.map((item) => item.title)).toEqual(expectedTitles)
      expect(sortedTwo.map((item) => item.title)).toEqual(expectedTitles)
    })

    it("should sort items by published date (oldest first) when titles are the same", () => {
      // Arrange
      const items = [
        createItem({ date: new Date("2023-01-01"), title: "Same Title" }),
        createItem({ date: new Date("2023-12-31"), title: "Same Title" }),
        createItem({ date: new Date("2023-06-15"), title: "Same Title" }),
      ]

      // Act
      const sorted = sortCollectionItems({
        items,
        sortBy: "title",
      })
      const sortedTwo = sortCollectionItems({
        items,
        sortOrder: "title-asc",
      })

      // Assert
      const expectedDates = [
        new Date("2023-01-01"),
        new Date("2023-06-15"),
        new Date("2023-12-31"),
      ]
      expect(sorted.map((item) => item.date)).toEqual(expectedDates)
      expect(sortedTwo.map((item) => item.date)).toEqual(expectedDates)
    })

    it("should sort items by published date (oldest first) when titles are the same and sort direction is ascending", () => {
      // Arrange
      const items = [
        createItem({ date: new Date("2023-01-01"), title: "Same Title" }),
        createItem({ date: new Date("2023-12-31"), title: "Same Title" }),
        createItem({ date: new Date("2023-06-15"), title: "Same Title" }),
      ]

      // Act
      const sorted = sortCollectionItems({
        items,
        sortBy: "title",
        sortDirection: "asc",
      })
      const sortedTwo = sortCollectionItems({
        items,
        sortOrder: "title-asc",
      })

      // Assert
      const expectedDates = [
        new Date("2023-01-01"),
        new Date("2023-06-15"),
        new Date("2023-12-31"),
      ]
      expect(sorted.map((item) => item.date)).toEqual(expectedDates)
      expect(sortedTwo.map((item) => item.date)).toEqual(expectedDates)
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
      const sortedTwo = sortCollectionItems({
        items,
        sortOrder: "title-asc",
      })

      // Assert
      const expectedTitles = ["1 ogpeople", "2 ogpeople", "10 ogpeople"]
      expect(sorted.map((item) => item.title)).toEqual(expectedTitles)
      expect(sortedTwo.map((item) => item.title)).toEqual(expectedTitles)
    })

    it("should sort items by last modified in ascending order if the titles are the same and they do not have published dates", () => {
      // Arrange
      const items = [
        createItem({
          date: undefined,
          lastModified: "2025-01-01T12:00:00Z",
          title: "Same Title",
        }),
        createItem({
          date: undefined,
          lastModified: "2025-03-01T12:00:00Z",
          title: "Same Title",
        }),
        createItem({
          date: undefined,
          lastModified: "2025-02-01T12:00:00Z",
          title: "Same Title",
        }),
      ]

      // Act
      const sorted = sortCollectionItems({
        items,
        sortBy: "title",
        sortDirection: "asc",
      })
      const sortedTwo = sortCollectionItems({
        items,
        sortOrder: "title-asc",
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
      expect(sortedTwo.map((item) => item.lastModified)).toEqual(
        expectedLastModified,
      )
    })

    it("should sort items with published dates before items without published dates when they all have the same title", () => {
      // Arrange
      const items = [
        createItem({ date: undefined, title: "Same title" }),
        createItem({ date: new Date("2023-12-31"), title: "Same title" }),
        createItem({ date: undefined, title: "Same title" }),
        createItem({ date: new Date("2023-01-01"), title: "Same title" }),
      ]

      // Act
      const sorted = sortCollectionItems({ items, sortBy: "title" })
      const sortedTwo = sortCollectionItems({
        items,
        sortOrder: "title-asc",
      })

      // Assert
      const expectedDates = [
        new Date("2023-01-01"),
        new Date("2023-12-31"),
        undefined,
        undefined,
      ]
      expect(sorted.map((item) => item.date)).toEqual(expectedDates)
      expect(sortedTwo.map((item) => item.date)).toEqual(expectedDates)
    })
  })
})
