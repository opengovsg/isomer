import type { ProcessedCollectionCardProps } from "~/interfaces"
import type { CollectionPageSchemaType } from "~/types"
import { describe, expect, it } from "vitest"
import { TAG_CATEGORY_DISPLAY_OPTIONS } from "~/types/constants"

import { getAvailableFilters } from "../getAvailableFilters"

const TODAY = "2026-06-15"
const EVENT_DATE_FILTER_ID = "event-date-filter-id"

const ongoingDateTagged = [
  {
    id: EVENT_DATE_FILTER_ID,
    date: "2026-06-10",
    endDate: "2026-06-20",
  },
]

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
        dateTagged: ongoingDateTagged,
        date: new Date("2023-01-01"),
      } as ProcessedCollectionCardProps,
    ]
    const tagCategories: CollectionPageSchemaType["page"]["tagCategories"] = [
      {
        id: EVENT_DATE_FILTER_ID,
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
    const result = getAvailableFilters(items, tagCategories, TODAY)

    // Assert — matches tagCategories order (date before tag), not type-grouped
    expect(result.map((filter) => filter.id)).toEqual([
      EVENT_DATE_FILTER_ID,
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
        dateTagged: ongoingDateTagged,
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
        id: EVENT_DATE_FILTER_ID,
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
    const result = getAvailableFilters(items, tagCategories, TODAY)

    // Assert
    expect(result.map((filter) => filter.id)).toEqual([
      "Category",
      EVENT_DATE_FILTER_ID,
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

  it("includes a date filter when only the date-range control is enabled", () => {
    const items: ProcessedCollectionCardProps[] = [
      {
        title: "Item 1",
        dateTagged: ongoingDateTagged,
        date: new Date("2023-01-01"),
      } as ProcessedCollectionCardProps,
    ]
    const tagCategories: CollectionPageSchemaType["page"]["tagCategories"] = [
      {
        id: EVENT_DATE_FILTER_ID,
        label: "Event Date",
        type: "date",
        showStatusLabels: false,
        showDateRange: true,
        statusLabels: [
          { id: "ENDED", label: "Event ended" },
          { id: "ONGOING", label: "Ongoing" },
          { id: "UPCOMING", label: "Upcoming" },
        ],
      },
    ]

    const result = getAvailableFilters(items, tagCategories, TODAY)

    expect(result.map((filter) => filter.id)).toEqual([
      EVENT_DATE_FILTER_ID,
      "year",
    ])
    expect(result[0]).toMatchObject({
      showStatusLabels: false,
      showDateRange: true,
    })
  })

  it("omits a date filter when both sidebar controls are hidden", () => {
    const items: ProcessedCollectionCardProps[] = [
      {
        title: "Item 1",
        dateTagged: ongoingDateTagged,
        date: new Date("2023-01-01"),
      } as ProcessedCollectionCardProps,
    ]
    const tagCategories: CollectionPageSchemaType["page"]["tagCategories"] = [
      {
        id: EVENT_DATE_FILTER_ID,
        label: "Event Date",
        type: "date",
        showStatusLabels: false,
        showDateRange: false,
        statusLabels: [
          { id: "ENDED", label: "Event ended" },
          { id: "ONGOING", label: "Ongoing" },
          { id: "UPCOMING", label: "Upcoming" },
        ],
      },
    ]

    const result = getAvailableFilters(items, tagCategories, TODAY)

    expect(result.map((filter) => filter.id)).toEqual(["year"])
  })
})
