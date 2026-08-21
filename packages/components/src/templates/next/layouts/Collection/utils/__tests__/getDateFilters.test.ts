import type { ProcessedCollectionCardProps } from "~/interfaces"
import type { CollectionPageSchemaType } from "~/types"
import { describe, expect, it } from "vitest"
import { DEFAULT_DATE_FILTER_SIDEBAR_VISIBILITY } from "~/types/constants"

import { getDateFilters } from "../getDateFilters"

const EVENT_DATE_FILTER_ID = "event-date-filter-id"

const tagCategories: NonNullable<
  CollectionPageSchemaType["page"]["tagCategories"]
> = [
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

describe("getDateFilters", () => {
  it("returns no filters when there are no tagCategories", () => {
    expect(getDateFilters([], undefined)).toEqual([])
  })

  it("ignores text-type tagCategories entirely", () => {
    const textOnly: NonNullable<
      CollectionPageSchemaType["page"]["tagCategories"]
    > = [{ id: "text-filter", label: "Category", options: [] }]

    expect(getDateFilters([], textOnly)).toEqual([])
  })

  it("counts items into their computed status bucket, dropping empty buckets", () => {
    // Arrange
    const items: ProcessedCollectionCardProps[] = [
      {
        dateFilterCards: [
          {
            id: EVENT_DATE_FILTER_ID,
            label: "Event Date",
            status: "ONGOING",
            statusLabel: "Ongoing",
            dateText: "",
          },
        ],
      } as ProcessedCollectionCardProps,
      {
        dateFilterCards: [
          {
            id: EVENT_DATE_FILTER_ID,
            label: "Event Date",
            status: "ONGOING",
            statusLabel: "Ongoing",
            dateText: "",
          },
        ],
      } as ProcessedCollectionCardProps,
      {
        dateFilterCards: [
          {
            id: EVENT_DATE_FILTER_ID,
            label: "Event Date",
            status: "UPCOMING",
            statusLabel: "Upcoming",
            dateText: "",
          },
        ],
      } as ProcessedCollectionCardProps,
    ]

    // Act
    const result = getDateFilters(items, tagCategories)

    // Assert — no ENDED bucket since count is 0, order follows statusLabels
    expect(result).toEqual([
      {
        id: EVENT_DATE_FILTER_ID,
        label: "Event Date",
        type: "date",
        showStatusLabels:
          DEFAULT_DATE_FILTER_SIDEBAR_VISIBILITY.showStatusLabels,
        showDateRange: DEFAULT_DATE_FILTER_SIDEBAR_VISIBILITY.showDateRange,
        items: [
          { id: "ONGOING", label: "Ongoing", count: 2 },
          { id: "UPCOMING", label: "Upcoming", count: 1 },
        ],
      },
    ])
  })

  it("resolves visibility flags from the date filter schema", () => {
    const categories: NonNullable<
      CollectionPageSchemaType["page"]["tagCategories"]
    > = [
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

    expect(getDateFilters([], categories)).toEqual([
      {
        id: EVENT_DATE_FILTER_ID,
        label: "Event Date",
        type: "date",
        showStatusLabels: false,
        showDateRange: false,
        items: [],
      },
    ])
  })

  it("returns an empty items list when no item has a value for the filter", () => {
    const items: ProcessedCollectionCardProps[] = [
      { dateFilterCards: undefined } as ProcessedCollectionCardProps,
    ]

    expect(getDateFilters(items, tagCategories)).toEqual([
      {
        id: EVENT_DATE_FILTER_ID,
        label: "Event Date",
        type: "date",
        showStatusLabels:
          DEFAULT_DATE_FILTER_SIDEBAR_VISIBILITY.showStatusLabels,
        showDateRange: DEFAULT_DATE_FILTER_SIDEBAR_VISIBILITY.showDateRange,
        items: [],
      },
    ])
  })
})
