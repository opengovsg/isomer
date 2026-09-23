import type { ProcessedCollectionCardProps } from "~/interfaces"
import type { CollectionPageSchemaType } from "~/types"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  DATE_FILTER_STATUS,
  DEFAULT_DATE_FILTER_STATUS_LABELS,
  TAG_CATEGORY_TYPE,
} from "~/types/constants"

import type { Filter } from "../../../../types/Filter"
import { refreshDateFilterCounts } from "../refreshDateFilterCounts"

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

const items: ProcessedCollectionCardProps[] = [
  {
    dateTagged: [
      {
        id: EVENT_DATE_FILTER_ID,
        date: TODAY,
      },
    ],
  } as ProcessedCollectionCardProps,
]

describe("refreshDateFilterCounts", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(`${TODAY}T12:00:00+08:00`))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("replaces publish-time date bucket counts and leaves other filters unchanged", () => {
    // Arrange
    const categoryFilter: Filter = {
      id: "Category",
      label: "Category",
      items: [{ id: "guides", label: "Guides", count: 2 }],
    }
    const publishedDateFilter: Filter = {
      id: EVENT_DATE_FILTER_ID,
      label: "Event Date",
      type: TAG_CATEGORY_TYPE.Date,
      items: [
        {
          id: DATE_FILTER_STATUS.Upcoming.id,
          label: DATE_FILTER_STATUS.Upcoming.defaultLabel,
          count: 1,
        },
      ],
    }

    // Act
    const result = refreshDateFilterCounts(
      [categoryFilter, publishedDateFilter],
      items,
      tagCategories,
    )

    // Assert
    expect(result[0]).toBe(categoryFilter)
    expect(result[1]?.items).toEqual([
      {
        id: DATE_FILTER_STATUS.Ongoing.id,
        label: DATE_FILTER_STATUS.Ongoing.defaultLabel,
        count: 1,
      },
    ])
  })

  it("drops a date filter when no bucket has a count on load", () => {
    // Arrange — label for every status is blank, so no bucket is shown
    const categoriesWithBlankLabels: NonNullable<
      CollectionPageSchemaType["page"]["tagCategories"]
    > = [
      {
        id: EVENT_DATE_FILTER_ID,
        label: "Event Date",
        type: TAG_CATEGORY_TYPE.Date,
        statusLabels: {
          [DATE_FILTER_STATUS.Ended.id]: "",
          [DATE_FILTER_STATUS.Ongoing.id]: "",
          [DATE_FILTER_STATUS.Upcoming.id]: "",
        },
      },
    ]
    const categoryFilter: Filter = {
      id: "Category",
      label: "Category",
      items: [{ id: "guides", label: "Guides", count: 1 }],
    }
    const publishedDateFilter: Filter = {
      id: EVENT_DATE_FILTER_ID,
      label: "Event Date",
      type: TAG_CATEGORY_TYPE.Date,
      items: [
        {
          id: DATE_FILTER_STATUS.Upcoming.id,
          label: DATE_FILTER_STATUS.Upcoming.defaultLabel,
          count: 1,
        },
      ],
    }

    // Act
    const result = refreshDateFilterCounts(
      [categoryFilter, publishedDateFilter],
      items,
      categoriesWithBlankLabels,
    )

    // Assert
    expect(result).toEqual([categoryFilter])
  })

  it("drops the date section on load when every event is ended and that label is blank", () => {
    // Arrange — build-time sidebar still lists these events as Upcoming.
    // On load they have all ended, and the Ended label was left empty.
    const categoryFilter: Filter = {
      id: "Category",
      label: "Category",
      items: [{ id: "guides", label: "Guides", count: 2 }],
    }
    const yearFilter: Filter = {
      id: "year",
      label: "Year",
      items: [{ id: "2026", label: "2026", count: 2 }],
    }
    const publishedDateFilter: Filter = {
      id: EVENT_DATE_FILTER_ID,
      label: "Event Date",
      type: TAG_CATEGORY_TYPE.Date,
      items: [
        {
          id: DATE_FILTER_STATUS.Upcoming.id,
          label: DATE_FILTER_STATUS.Upcoming.defaultLabel,
          count: 2,
        },
      ],
    }
    const endedItems: ProcessedCollectionCardProps[] = [
      {
        dateTagged: [{ id: EVENT_DATE_FILTER_ID, date: "2026-05-01" }],
      } as ProcessedCollectionCardProps,
      {
        dateTagged: [
          {
            id: EVENT_DATE_FILTER_ID,
            date: "2026-05-10",
            endDate: "2026-05-12",
          },
        ],
      } as ProcessedCollectionCardProps,
    ]
    const categoriesWithBlankEndedLabel: NonNullable<
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

    // Act
    const result = refreshDateFilterCounts(
      [categoryFilter, publishedDateFilter, yearFilter],
      endedItems,
      categoriesWithBlankEndedLabel,
    )

    // Assert — load time: the date section is gone; other filters are untouched
    expect(result.map(({ id, type }) => ({ id, type }))).toEqual([
      { id: "Category", type: undefined },
      { id: "year", type: undefined },
    ])
    expect(result[0]).toBe(categoryFilter)
    expect(result[1]).toBe(yearFilter)
  })

  it("keeps only buckets that still have a label and items on load", () => {
    // Arrange — build-time sidebar lists both events as Upcoming.
    // On load one has ended (label blank) and one is ongoing.
    const categoryFilter: Filter = {
      id: "Category",
      label: "Category",
      items: [{ id: "guides", label: "Guides", count: 2 }],
    }
    const publishedDateFilter: Filter = {
      id: EVENT_DATE_FILTER_ID,
      label: "Event Date",
      type: TAG_CATEGORY_TYPE.Date,
      items: [
        {
          id: DATE_FILTER_STATUS.Upcoming.id,
          label: DATE_FILTER_STATUS.Upcoming.defaultLabel,
          count: 2,
        },
      ],
    }
    const mixedItems: ProcessedCollectionCardProps[] = [
      {
        dateTagged: [{ id: EVENT_DATE_FILTER_ID, date: "2026-05-01" }],
      } as ProcessedCollectionCardProps,
      {
        dateTagged: [{ id: EVENT_DATE_FILTER_ID, date: TODAY }],
      } as ProcessedCollectionCardProps,
    ]
    const categoriesWithBlankEndedLabel: NonNullable<
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

    // Act
    const result = refreshDateFilterCounts(
      [categoryFilter, publishedDateFilter],
      mixedItems,
      categoriesWithBlankEndedLabel,
    )

    // Assert — load time: Ongoing remains; the published Upcoming bucket does not
    expect(result[0]).toBe(categoryFilter)
    expect(result[1]?.items).toEqual([
      {
        id: DATE_FILTER_STATUS.Ongoing.id,
        label: DATE_FILTER_STATUS.Ongoing.defaultLabel,
        count: 1,
      },
    ])
  })
})
