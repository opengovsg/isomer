import type { ProcessedCollectionCardProps } from "~/interfaces"
import type { CollectionPageSchemaType } from "~/types"
import { describe, expect, it } from "vitest"
import { TAG_CATEGORY_DISPLAY_OPTIONS } from "~/types/constants"

import { getAvailableFilters } from "../getAvailableFilters"

describe("getAvailableFilters", () => {
  it("returns no filters when there are no items", () => {
    // Arrange
    const items: ProcessedCollectionCardProps[] = []

    // Act
    const result = getAvailableFilters(items)

    // Assert
    expect(result).toEqual([])
  })

  it("renders a migrated 'Category' tagCategories group as an ordinary tag filter, not duplicated", () => {
    // Arrange
    const items: ProcessedCollectionCardProps[] = [
      {
        title: "Item 1",
        tags: [{ selected: ["Guides"], category: "Category" }],
        date: new Date("2023-01-01"),
      } as ProcessedCollectionCardProps,
    ]
    const tagCategories: CollectionPageSchemaType["page"]["tagCategories"] = [
      {
        label: "Category",
        id: "cat-1",
        isRequired: true,
        display: TAG_CATEGORY_DISPLAY_OPTIONS.Pills,
        options: [{ label: "Guides", id: "opt-1" }],
      },
    ]

    // Act
    const result = getAvailableFilters(items, tagCategories)

    // Assert — exactly one "Category" filter, sourced from tagCategories/tags
    const categoryFilters = result.filter((filter) => filter.id === "Category")
    expect(categoryFilters).toHaveLength(1)
    expect(categoryFilters[0]).toEqual({
      id: "Category",
      label: "Category",
      display: TAG_CATEGORY_DISPLAY_OPTIONS.Pills,
      items: [{ id: "Guides", label: "Guides", count: 1 }],
    })
  })

  it("orders tag filters (including a migrated Category group) before the year filter", () => {
    // Arrange
    const items: ProcessedCollectionCardProps[] = [
      {
        title: "Item 1",
        tags: [{ selected: ["Guides"], category: "Category" }],
        date: new Date("2023-01-01"),
      } as ProcessedCollectionCardProps,
    ]

    // Act
    const result = getAvailableFilters(items)

    // Assert
    expect(result.map((filter) => filter.id)).toEqual(["Category", "year"])
  })

  it("orders a date filter before a tag filter when it comes first in tagCategories", () => {
    // Arrange
    const items: ProcessedCollectionCardProps[] = [
      {
        title: "Item 1",
        tags: [{ selected: ["Guides"], category: "Category" }],
        dateFilterCards: [
          {
            id: "event-date-filter-id",
            label: "Event Date",
            status: "ONGOING",
            statusLabel: "Ongoing",
            dateText: "1 Jun - 30 Jun 2026",
          },
        ],
        date: new Date("2023-01-01"),
      } as ProcessedCollectionCardProps,
    ]
    const tagCategories: CollectionPageSchemaType["page"]["tagCategories"] = [
      {
        id: "event-date-filter-id",
        label: "Event Date",
        type: "date",
        statusLabels: [
          { id: "ENDED", label: "Event ended" },
          { id: "ONGOING", label: "Ongoing" },
          { id: "UPCOMING", label: "Upcoming" },
        ],
      },
      {
        label: "Category",
        id: "cat-1",
        isRequired: true,
        display: TAG_CATEGORY_DISPLAY_OPTIONS.Pills,
        options: [{ label: "Guides", id: "opt-1" }],
      },
    ]

    // Act
    const result = getAvailableFilters(items, tagCategories)

    // Assert — matches tagCategories order (date before tag), not type-grouped
    expect(result.map((filter) => filter.id)).toEqual([
      "event-date-filter-id",
      "Category",
      "year",
    ])
  })

  it("includes a date filter, ordered between tag filters and the year filter", () => {
    // Arrange
    const items: ProcessedCollectionCardProps[] = [
      {
        title: "Item 1",
        tags: [{ selected: ["Guides"], category: "Category" }],
        dateFilterCards: [
          {
            id: "event-date-filter-id",
            label: "Event Date",
            status: "ONGOING",
            statusLabel: "Ongoing",
            dateText: "1 Jun - 30 Jun 2026",
          },
        ],
        date: new Date("2023-01-01"),
      } as ProcessedCollectionCardProps,
    ]
    const tagCategories: CollectionPageSchemaType["page"]["tagCategories"] = [
      {
        label: "Category",
        id: "cat-1",
        isRequired: true,
        display: TAG_CATEGORY_DISPLAY_OPTIONS.Pills,
        options: [{ label: "Guides", id: "opt-1" }],
      },
      {
        id: "event-date-filter-id",
        label: "Event Date",
        type: "date",
        statusLabels: [
          { id: "ENDED", label: "Event ended" },
          { id: "ONGOING", label: "Ongoing" },
          { id: "UPCOMING", label: "Upcoming" },
        ],
      },
    ]

    // Act
    const result = getAvailableFilters(items, tagCategories)

    // Assert
    expect(result.map((filter) => filter.id)).toEqual([
      "Category",
      "event-date-filter-id",
      "year",
    ])
  })

  it("omits filters that have no items", () => {
    // Arrange
    const items: ProcessedCollectionCardProps[] = [
      {
        title: "Item 1",
        tags: [],
        date: undefined,
      } as unknown as ProcessedCollectionCardProps,
    ]

    // Act
    const result = getAvailableFilters(items)

    // Assert
    expect(result).toEqual([])
  })
})
