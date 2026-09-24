import type { ProcessedCollectionCardProps } from "~/interfaces"
import type { CollectionPageSchemaType } from "~/types"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  DATE_FILTER_STATUS,
  DEFAULT_DATE_FILTER_STATUS_LABELS,
  TAG_CATEGORY_TYPE,
} from "~/types/constants"

import { getDateFilters } from "../getDateFilters"

const EVENT_DATE_FILTER_ID = "event-date-filter-id"
const TODAY = "2026-06-15"

const tagCategories: NonNullable<
  CollectionPageSchemaType["page"]["tagCategories"]
> = [
  {
    id: EVENT_DATE_FILTER_ID,
    label: "Event Date",
    type: TAG_CATEGORY_TYPE.Date,
    statusLabels: DEFAULT_DATE_FILTER_STATUS_LABELS,
  },
]

describe("getDateFilters", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(`${TODAY}T12:00:00+08:00`))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

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

    expect(getDateFilters(items, tagCategories)).toEqual([
      {
        id: EVENT_DATE_FILTER_ID,
        label: "Event Date",
        type: TAG_CATEGORY_TYPE.Date,
        showStatusLabelsFilter: true,
        showDateRangeFilter: true,
        dateTaggedItemCount: 3,
        items: [
          {
            id: DATE_FILTER_STATUS.Ongoing.id,
            label: DATE_FILTER_STATUS.Ongoing.defaultLabel,
            count: 2,
          },
          {
            id: DATE_FILTER_STATUS.Upcoming.id,
            label: DATE_FILTER_STATUS.Upcoming.defaultLabel,
            count: 1,
          },
        ],
      },
    ])
  })

  it("returns an empty items list when no item has a value for the filter", () => {
    const items: ProcessedCollectionCardProps[] = [
      { dateTagged: undefined } as ProcessedCollectionCardProps,
    ]

    expect(getDateFilters(items, tagCategories)).toEqual([
      {
        id: EVENT_DATE_FILTER_ID,
        label: "Event Date",
        type: TAG_CATEGORY_TYPE.Date,
        showStatusLabelsFilter: true,
        showDateRangeFilter: true,
        dateTaggedItemCount: 0,
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
        type: TAG_CATEGORY_TYPE.Date,
        statusLabels: {
          ...DEFAULT_DATE_FILTER_STATUS_LABELS,
          [DATE_FILTER_STATUS.Ended.id]: "",
        },
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

    expect(getDateFilters(items, categoriesWithBlankLabel)).toEqual([
      {
        id: EVENT_DATE_FILTER_ID,
        label: "Event Date",
        type: TAG_CATEGORY_TYPE.Date,
        showStatusLabelsFilter: true,
        showDateRangeFilter: true,
        dateTaggedItemCount: 1,
        items: [],
      },
    ])
  })
})
