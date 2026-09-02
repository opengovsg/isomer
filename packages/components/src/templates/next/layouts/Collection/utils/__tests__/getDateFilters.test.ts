import type { ProcessedCollectionCardProps } from "~/interfaces"
import type { CollectionPageSchemaType } from "~/types"
import { describe, expect, it } from "vitest"

import { getDateFilters } from "../getDateFilters"

const EVENT_DATE_FILTER_ID = "event-date-filter-id"
const TODAY = "2026-06-15"

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
    expect(getDateFilters([], undefined, TODAY)).toEqual([])
  })

  it("ignores text-type tagCategories entirely", () => {
    const textOnly: NonNullable<
      CollectionPageSchemaType["page"]["tagCategories"]
    > = [{ id: "text-filter", label: "Category", options: [] }]

    expect(getDateFilters([], textOnly, TODAY)).toEqual([])
  })

  it("counts items into their computed status bucket, dropping empty buckets", () => {
    // Arrange
    const items: ProcessedCollectionCardProps[] = [
      {
        dateTagged: [
          {
            id: EVENT_DATE_FILTER_ID,
            date: "2026-06-10",
            endDate: "2026-06-20",
          },
        ],
      } as ProcessedCollectionCardProps,
      {
        dateTagged: [
          {
            id: EVENT_DATE_FILTER_ID,
            date: "2026-06-10",
            endDate: "2026-06-20",
          },
        ],
      } as ProcessedCollectionCardProps,
      {
        dateTagged: [
          {
            id: EVENT_DATE_FILTER_ID,
            date: "2026-07-01",
            endDate: "2026-07-10",
          },
        ],
      } as ProcessedCollectionCardProps,
    ]

    // Act
    const result = getDateFilters(items, tagCategories, TODAY)

    // Assert — no ENDED bucket since count is 0, order follows statusLabels
    expect(result).toEqual([
      {
        id: EVENT_DATE_FILTER_ID,
        label: "Event Date",
        type: "date",
        items: [
          { id: "ONGOING", label: "Ongoing", count: 2 },
          { id: "UPCOMING", label: "Upcoming", count: 1 },
        ],
      },
    ])
  })

  it("returns an empty items list when no item has a value for the filter", () => {
    const items: ProcessedCollectionCardProps[] = [
      { dateTagged: undefined } as ProcessedCollectionCardProps,
    ]

    expect(getDateFilters(items, tagCategories, TODAY)).toEqual([
      {
        id: EVENT_DATE_FILTER_ID,
        label: "Event Date",
        type: "date",
        items: [],
      },
    ])
  })

  it("omits sidebar buckets whose status labels are blank", () => {
    const categoriesWithBlankLabel: NonNullable<
      CollectionPageSchemaType["page"]["tagCategories"]
    > = [
      {
        id: EVENT_DATE_FILTER_ID,
        label: "Event Date",
        type: "date",
        statusLabels: [
          { id: "ENDED", label: "" },
          { id: "ONGOING", label: "Ongoing" },
          { id: "UPCOMING", label: "Upcoming" },
        ],
      },
    ]
    const items: ProcessedCollectionCardProps[] = [
      {
        dateTagged: [
          {
            id: EVENT_DATE_FILTER_ID,
            date: "2026-05-01",
            endDate: "2026-05-10",
          },
        ],
      } as ProcessedCollectionCardProps,
    ]

    expect(getDateFilters(items, categoriesWithBlankLabel, TODAY)).toEqual([
      {
        id: EVENT_DATE_FILTER_ID,
        label: "Event Date",
        type: "date",
        items: [],
      },
    ])
  })
})
