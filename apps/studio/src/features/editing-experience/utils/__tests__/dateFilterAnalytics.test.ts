import type { IsomerSchema } from "@opengovsg/isomer-components"
import { TAG_CATEGORY_TYPE } from "@opengovsg/isomer-components"
import { describe, expect, it } from "vitest"

import type { CollectionTags } from "../../hooks/useCollectionTags"
import {
  getChangedDateFilterSortDirection,
  getCollectionItemDateProperties,
  getCollectionPage,
  listChangedDateFilters,
} from "../dateFilterAnalytics"

const DATE_FILTER_ID = "f47ac10b-58cc-4372-a567-0e02b2c3d479"
const OTHER_DATE_FILTER_ID = "a58bd21c-69dd-5483-b678-1f13c3d4e580"

const dateFilter = (
  overrides: Partial<CollectionTags[number]> = {},
): CollectionTags[number] => ({
  id: DATE_FILTER_ID,
  label: "Event date",
  type: TAG_CATEGORY_TYPE.Date,
  isRequired: true,
  statusLabels: {
    ONGOING: "Ongoing",
    UPCOMING: "Upcoming",
    ENDED: "Event ended",
  },
  ...overrides,
})

describe("listChangedDateFilters", () => {
  it("records a new date filter with visitor controls on and default labels", () => {
    // Arrange / Act
    const result = listChangedDateFilters(undefined, [dateFilter()])

    // Assert
    expect(result).toEqual([
      {
        isRequired: true,
        showStatusLabelsFilter: true,
        showDateRangeFilter: true,
        statusLabelsCustomized: false,
      },
    ])
  })

  it("skips a date filter whose setup did not change", () => {
    // Arrange
    const filter = dateFilter({ label: "Registration" })

    // Act
    const result = listChangedDateFilters(
      [filter],
      [dateFilter({ label: "Event date" })],
    )

    // Assert
    expect(result).toEqual([])
  })

  it("records a required toggle, hidden visitor controls, and a rewritten label", () => {
    // Arrange
    const before = [dateFilter()]
    const after = [
      dateFilter({
        isRequired: false,
        showStatusLabelsFilter: false,
        showDateRangeFilter: false,
        statusLabels: {
          ONGOING: "Live",
          UPCOMING: "Upcoming",
          ENDED: "Event ended",
        },
      }),
    ]

    // Act
    const result = listChangedDateFilters(before, after)

    // Assert
    expect(result).toEqual([
      {
        isRequired: false,
        showStatusLabelsFilter: false,
        showDateRangeFilter: false,
        statusLabelsCustomized: true,
      },
    ])
  })

  it("treats a cleared status label as customized", () => {
    // Arrange / Act
    const result = listChangedDateFilters(undefined, [
      dateFilter({
        statusLabels: {
          ONGOING: "Ongoing",
          UPCOMING: "Upcoming",
          ENDED: "",
        },
      }),
    ])

    // Assert
    expect(result[0]?.statusLabelsCustomized).toBe(true)
  })
})

describe("getCollectionItemDateProperties", () => {
  const tags = [
    dateFilter(),
    dateFilter({ id: OTHER_DATE_FILTER_ID, label: "Closing date" }),
  ]

  it("returns undefined when the collection has no date filters", () => {
    // Arrange / Act
    const result = getCollectionItemDateProperties([], [
      { id: DATE_FILTER_ID, date: "2026-01-01" },
    ])

    // Assert
    expect(result).toBeUndefined()
  })

  it("counts filled dates against the collection's date filters", () => {
    // Arrange / Act
    const result = getCollectionItemDateProperties(tags, [
      { id: DATE_FILTER_ID, date: "2026-01-01", endDate: "2026-01-03" },
      { id: "not-a-filter", date: "2026-02-01" },
    ])

    // Assert
    expect(result).toEqual({
      datesFilled: 1,
      dateFilterCount: 2,
      hasRange: true,
    })
  })

  it("reports a single day when no filled date has an end date", () => {
    // Arrange / Act
    const result = getCollectionItemDateProperties(tags, [
      { id: DATE_FILTER_ID, date: "2026-01-01" },
    ])

    // Assert
    expect(result).toEqual({
      datesFilled: 1,
      dateFilterCount: 2,
      hasRange: false,
    })
  })
})

describe("getChangedDateFilterSortDirection", () => {
  const sortOrder = `date-filter-${DATE_FILTER_ID}-asc`

  it("returns the direction when the saved sort becomes a date filter", () => {
    // Arrange / Act
    const result = getChangedDateFilterSortDirection("date-desc", sortOrder)

    // Assert
    expect(result).toBe("asc")
  })

  it("returns undefined when the date-filter sort did not change", () => {
    // Arrange / Act
    const result = getChangedDateFilterSortDirection(sortOrder, sortOrder)

    // Assert
    expect(result).toBeUndefined()
  })

  it("returns undefined for a title sort", () => {
    // Arrange / Act
    const result = getChangedDateFilterSortDirection(
      "date-desc",
      "title-asc",
    )

    // Assert
    expect(result).toBeUndefined()
  })
})

describe("getCollectionPage", () => {
  it("returns the page for a collection and ignores other layouts", () => {
    // Arrange
    const collection = {
      layout: "collection",
      page: { sortOrder: "date-desc" },
    } as IsomerSchema
    const article = {
      layout: "article",
      page: {},
    } as IsomerSchema

    // Act / Assert
    expect(getCollectionPage(collection)?.sortOrder).toBe("date-desc")
    expect(getCollectionPage(article)).toBeUndefined()
  })
})
