import { beforeAll, describe, expect, it } from "vitest"

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
      lastUpdated: "2024-12-01T12:00:00Z",
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

  it("should sort items by date (newest first)", () => {
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

  it("should sort by last modified date when dates are equal", () => {
    // Arrange
    const sameDate = new Date("2023-01-01")
    const items = [
      createItem({
        title: "Charlie",
        date: sameDate,
        lastUpdated: "2025-01-01T12:00:00Z",
      }),
      createItem({
        title: "Alice",
        date: sameDate,
        lastUpdated: "2025-03-01T12:00:00Z",
      }),
      createItem({
        title: "Bob",
        date: sameDate,
        lastUpdated: "2025-02-01T12:00:00Z",
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
        lastUpdated: sameLastUpdated,
      }),
      createItem({
        title: "Alice",
        date: sameDate,
        lastUpdated: sameLastUpdated,
      }),
      createItem({
        title: "Bob",
        date: sameDate,
        lastUpdated: sameLastUpdated,
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

  describe("should place items without dates at the end, sorted alphabetically by title:", () => {
    let items: AllCardProps[]

    beforeAll(() => {
      items = [
        createItem({ title: "No Date", date: undefined }),
        createItem({ title: "Newest", date: new Date("2023-12-31") }),
        createItem({ title: "Also No Date", date: undefined }),
        createItem({ title: "Oldest", date: new Date("2023-01-01") }),
      ]
    })

    it("sortBy is title", () => {
      // Act
      const sorted = sortCollectionItems({
        items,
        sortBy: "title",
        sortDirection: "asc",
      })

      // Assert
      const expectedTitles = ["Newest", "Oldest", "Also No Date", "No Date"]
      expect(sorted.map((item) => item.title)).toEqual(expectedTitles)
    })

    it("sortBy is category", () => {
      // Act
      const sorted = sortCollectionItems({
        items,
        sortBy: "category",
        sortDirection: "asc",
      })

      // Assert
      const expectedTitles = ["Newest", "Oldest", "Also No Date", "No Date"]
      expect(sorted.map((item) => item.title)).toEqual(expectedTitles)
    })

    it("sortBy is date", () => {
      // Act
      const sorted = sortCollectionItems({
        items,
        sortBy: "date",
        sortDirection: "desc",
      })

      // Assert
      const expectedTitles = ["Newest", "Oldest", "Also No Date", "No Date"]
      expect(sorted.map((item) => item.title)).toEqual(expectedTitles)
    })
  })

  describe("should sort by title with date as tiebreaker (newest first) when sortBy is title and", () => {
    let items: AllCardProps[]

    beforeAll(() => {
      // Arrange
      const sameDate = new Date("2023-01-01")
      items = [
        createItem({
          title: "Charlie",
          date: new Date("2023-12-30"),
          url: "/charlie-2023-12-30",
        }),
        createItem({
          title: "Charlie",
          date: new Date("2023-12-31"),
          url: "/charlie-2023-12-31",
        }),
        createItem({ title: "Alice", date: new Date("2022-01-01") }),
        createItem({ title: "Bob", date: sameDate }),
        createItem({ title: "David", date: sameDate }),
      ]
    })

    it("sortDirection is desc", () => {
      // Act
      const sorted = sortCollectionItems({
        items,
        sortBy: "title",
        sortDirection: "desc",
      })

      // Assert
      const expectedTitles = ["David", "Charlie", "Charlie", "Bob", "Alice"]
      expect(sorted.map((item) => item.title)).toEqual(expectedTitles)
      expect(sorted[1]?.url).toEqual("/charlie-2023-12-31")
      expect(sorted[2]?.url).toEqual("/charlie-2023-12-30")
    })

    it("sortDirection is asc", () => {
      // Act
      const sorted = sortCollectionItems({
        items,
        sortBy: "title",
        sortDirection: "asc",
      })

      // Assert
      const expectedTitles = ["Alice", "Bob", "Charlie", "Charlie", "David"]
      expect(sorted.map((item) => item.title)).toEqual(expectedTitles)
      expect(sorted[2]?.url).toEqual("/charlie-2023-12-31")
      expect(sorted[3]?.url).toEqual("/charlie-2023-12-30")
    })
  })

  describe("should sort by category with title as tiebreaker (alphabetically) when sortBy is category and", () => {
    let items: AllCardProps[]

    beforeAll(() => {
      items = [
        createItem({ category: "2000" }),
        createItem({ category: "2001", title: "Alice" }),
        createItem({ category: "2001", title: "Bob" }),
        createItem({ category: "2002" }),
      ]
    })

    it("sortDirection is desc", () => {
      // Act
      const sorted = sortCollectionItems({
        items,
        sortBy: "category",
        sortDirection: "desc",
      })

      // Assert
      const expectedCategories = ["2002", "2001", "2001", "2000"]
      expect(sorted.map((item) => item.category)).toEqual(expectedCategories)
      expect(sorted[1]?.title).toEqual("Alice")
      expect(sorted[2]?.title).toEqual("Bob")
    })

    it("sortDirection is asc", () => {
      // Act
      const sorted = sortCollectionItems({
        items,
        sortBy: "category",
        sortDirection: "asc",
      })

      // Assert
      const expectedCategories = ["2000", "2001", "2001", "2002"]
      expect(sorted.map((item) => item.category)).toEqual(expectedCategories)
      expect(sorted[1]?.title).toEqual("Alice")
      expect(sorted[2]?.title).toEqual("Bob")
    })
  })

  describe("should sort by date with last modified and alphabetical title as tiebreaker when sortBy is date and", () => {
    let items: AllCardProps[]

    beforeAll(() => {
      // Arrange
      const sameDate = new Date("2023-01-01")
      items = [
        createItem({ title: "Newest", date: new Date("2023-12-31") }),
        createItem({ title: "Charlie", date: sameDate }),
        createItem({ title: "Alice", date: sameDate }),
        createItem({ title: "Bob", date: sameDate }),
        createItem({ title: "Oldest", date: new Date("2022-01-01") }),
      ]
    })

    it("sortDirection is desc", () => {
      // Act
      const sorted = sortCollectionItems({
        items,
        sortBy: "date",
        sortDirection: "desc",
      })

      // Assert
      const expectedTitles = ["Newest", "Alice", "Bob", "Charlie", "Oldest"]
      expect(sorted.map((item) => item.title)).toEqual(expectedTitles)
    })

    it("sortDirection is asc", () => {
      // Act
      const sorted = sortCollectionItems({
        items,
        sortBy: "date",
        sortDirection: "asc",
      })

      // Assert
      const expectedTitles = ["Oldest", "Alice", "Bob", "Charlie", "Newest"]
      expect(sorted.map((item) => item.title)).toEqual(expectedTitles)
    })
  })
})
