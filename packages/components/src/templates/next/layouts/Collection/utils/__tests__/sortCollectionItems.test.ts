import { beforeAll, describe, expect, it } from "vitest"

import type { SortableCardProps } from "../sortCollectionItems"
import { sortCollectionItems } from "../sortCollectionItems"

describe("sortCollectionItems", () => {
  const createItem = ({
    title,
    date,
    variant = "article",
    url = "",
  }: {
    title: string
    date?: Date
    variant?: "file" | "link" | "article"
    url?: string
  }): SortableCardProps => {
    return {
      title,
      rawDate: date,
      variant,
      url,
      description: "",
      category: "Others",
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
        logoUrl: "",
        search: {
          type: "localSearch",
          searchUrl: "/search",
        },
        navBarItems: [],
        footerItems: {
          siteNavItems: [],
          privacyStatementLink: "/privacy",
          termsOfUseLink: "/terms",
        },
        lastUpdated: "2024-01-01",
      },
    } as SortableCardProps
  }

  it("should sort items by date (newest first)", () => {
    const items = [
      createItem({ title: "Oldest", date: new Date("2023-01-01") }),
      createItem({ title: "Newest", date: new Date("2023-12-31") }),
      createItem({ title: "Middle", date: new Date("2023-06-15") }),
    ]

    const sorted = sortCollectionItems({ items })
    expect(sorted[0]?.title).toBe("Newest")
    expect(sorted[1]?.title).toBe("Middle")
    expect(sorted[2]?.title).toBe("Oldest")
  })

  it("should sort by title when dates are equal", () => {
    const sameDate = new Date("2023-01-01")
    const items = [
      createItem({ title: "Charlie", date: sameDate }),
      createItem({ title: "Alice", date: sameDate }),
      createItem({ title: "Bob", date: sameDate }),
    ]

    const sorted = sortCollectionItems({ items })
    expect(sorted[0]?.title).toBe("Alice")
    expect(sorted[1]?.title).toBe("Bob")
    expect(sorted[2]?.title).toBe("Charlie")
  })

  it("should place items without dates at the end", () => {
    const items = [
      createItem({ title: "No Date" }),
      createItem({ title: "Newest", date: new Date("2023-12-31") }),
      createItem({ title: "Also No Date" }),
      createItem({ title: "Oldest", date: new Date("2023-01-01") }),
    ]

    const sorted = sortCollectionItems({ items })
    expect(sorted[0]?.title).toBe("Newest")
    expect(sorted[1]?.title).toBe("Oldest")
    expect(sorted[2]?.title).toBe("Also No Date")
    expect(sorted[3]?.title).toBe("No Date")
  })

  it("should sort items without dates by title", () => {
    const items = [
      createItem({ title: "Charlie" }),
      createItem({ title: "Alice" }),
      createItem({ title: "Bob" }),
    ]

    const sorted = sortCollectionItems({ items })
    expect(sorted[0]?.title).toBe("Alice")
    expect(sorted[1]?.title).toBe("Bob")
    expect(sorted[2]?.title).toBe("Charlie")
  })

  describe("should sort by title with date as tiebreaker (newest first) when sortBy is title and", () => {
    let items: SortableCardProps[]

    beforeAll(() => {
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
      const sorted = sortCollectionItems({
        items,
        sortBy: "title",
        sortDirection: "desc",
      })

      expect(sorted[0]?.title).toBe("David")
      expect(sorted[1]).toEqual(
        expect.objectContaining({
          title: "Charlie",
          url: "/charlie-2023-12-31",
        }),
      )
      expect(sorted[2]).toEqual(
        expect.objectContaining({
          title: "Charlie",
          url: "/charlie-2023-12-30",
        }),
      )
      expect(sorted[3]?.title).toBe("Bob")
      expect(sorted[4]?.title).toBe("Alice")
    })

    it("sortDirection is asc", () => {
      const sorted = sortCollectionItems({
        items,
        sortBy: "title",
        sortDirection: "asc",
      })

      expect(sorted[0]?.title).toBe("Alice")
      expect(sorted[1]?.title).toBe("Bob")
      expect(sorted[2]).toEqual(
        expect.objectContaining({
          title: "Charlie",
          url: "/charlie-2023-12-31",
        }),
      )
      expect(sorted[3]).toEqual(
        expect.objectContaining({
          title: "Charlie",
          url: "/charlie-2023-12-30",
        }),
      )
      expect(sorted[1]?.title).toBe("David")
    })
  })

  describe("should sort by date with title as tiebreaker (alphabetically) when sortBy is date and", () => {
    let items: SortableCardProps[]

    beforeAll(() => {
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
      const sorted = sortCollectionItems({
        items,
        sortBy: "date",
        sortDirection: "desc",
      })

      expect(sorted[0]?.title).toBe("Oldest")
      expect(sorted[1]?.title).toBe("Alice")
      expect(sorted[2]?.title).toBe("Bob")
      expect(sorted[3]?.title).toBe("Charlie")
      expect(sorted[4]?.title).toBe("Newest")
    })

    it("sortDirection is asc", () => {
      const sorted = sortCollectionItems({
        items,
        sortBy: "date",
        sortDirection: "asc",
      })

      expect(sorted[0]?.title).toBe("Newest")
      expect(sorted[1]?.title).toBe("Alice")
      expect(sorted[2]?.title).toBe("Bob")
      expect(sorted[3]?.title).toBe("Charlie")
      expect(sorted[4]?.title).toBe("Oldest")
    })
  })
})
