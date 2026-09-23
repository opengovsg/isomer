import {
  COLLECTION_SORT_ORDER,
  DEFAULT_DATE_FILTER_STATUS_LABELS,
  TAG_CATEGORY_TYPE,
  type CollectionPagePageProps,
  type DateFilterSchemaType,
} from "@opengovsg/isomer-components"

import type { CollectionTags } from "../../hooks/useCollectionTags"
import {
  getChangedDateFilterSortDirection,
  getCollectionItemDateProperties,
  listChangedDateFilters,
} from "../dateFilterAnalytics"

// Hardcoded tag-category ids so each fixture filter stays identifiable across before/after.
const EVENT_DATE_ID = "550e8400-e29b-41d4-a716-446655440000"
const DEADLINE_ID = "6ba7b810-9dad-11d1-80b4-00c04fd430c8"
const BOOTH_ID = "f47ac10b-58cc-4372-a567-0e02b2c3d479"
const TOPIC_ID = "c70df43e-8bff-46a5-889a-3a35e5f6a702"

type TagCategories = NonNullable<CollectionPagePageProps["tagCategories"]>

const dateFilter = (
  id: string,
  overrides: Partial<DateFilterSchemaType> = {},
): DateFilterSchemaType => ({
  id,
  label: "Event date",
  type: TAG_CATEGORY_TYPE.Date,
  statusLabels: { ...DEFAULT_DATE_FILTER_STATUS_LABELS },
  ...overrides,
})

const topicCategory: TagCategories[number] = {
  id: TOPIC_ID,
  label: "Topic",
  isRequired: true,
  options: [{ id: "some-option-id", label: "Technology" }],
}

describe("listChangedDateFilters", () => {
  it("reports resolved defaults for a new filter that omits optional settings", () => {
    // Arrange
    const added = dateFilter(EVENT_DATE_ID, { statusLabels: {} })

    // Act
    const changed = listChangedDateFilters({
      before: undefined,
      after: [added],
    })

    // Assert
    expect(changed).toEqual([
      {
        isRequired: false,
        showStatusLabelsFilter: true,
        showDateRangeFilter: true,
        statusLabelsCustomized: false,
      },
    ])
  })

  it("treats explicit defaults as unchanged, including a renamed filter", () => {
    // Arrange
    const before = dateFilter(EVENT_DATE_ID, { statusLabels: {} })
    const after = dateFilter(EVENT_DATE_ID, {
      label: "When",
      isRequired: false,
      showStatusLabelsFilter: true,
      showDateRangeFilter: true,
    })

    // Act
    const changed = listChangedDateFilters({
      before: [before],
      after: [after],
    })

    // Assert
    expect(changed).toEqual([])
  })

  it("ignores removed date filters and edits to text categories", () => {
    // Arrange
    const before: TagCategories = [dateFilter(EVENT_DATE_ID), topicCategory]
    const after: TagCategories = [{ ...topicCategory, label: "Theme" }]

    // Act
    const changed = listChangedDateFilters({ before, after })

    // Assert
    expect(changed).toEqual([])
  })

  it("reports each filter whose tracked setting changed, in saved order", () => {
    // Arrange
    const before: TagCategories = [
      dateFilter(EVENT_DATE_ID),
      dateFilter(DEADLINE_ID, { label: "Registration deadline" }),
      dateFilter(BOOTH_ID, {
        label: "Booth setup",
        showStatusLabelsFilter: true,
        showDateRangeFilter: true,
      }),
      topicCategory,
    ]
    const after: TagCategories = [
      dateFilter(EVENT_DATE_ID, { label: "When" }),
      dateFilter(DEADLINE_ID, {
        label: "Registration deadline",
        isRequired: true,
      }),
      dateFilter(BOOTH_ID, {
        label: "Booth setup",
        showStatusLabelsFilter: false,
        showDateRangeFilter: false,
        statusLabels: {
          ...DEFAULT_DATE_FILTER_STATUS_LABELS,
          ONGOING: "In progress",
        },
      }),
      { ...topicCategory, label: "Theme" },
      dateFilter("a58bd21c-69dd-5483-b678-1f13c3d4e580", {
        label: "Publish date",
        isRequired: true,
        statusLabels: {},
      }),
    ]

    // Act
    const changed = listChangedDateFilters({ before, after })

    // Assert
    expect(changed).toEqual([
      {
        isRequired: true,
        showStatusLabelsFilter: true,
        showDateRangeFilter: true,
        statusLabelsCustomized: false,
      },
      {
        isRequired: false,
        showStatusLabelsFilter: false,
        showDateRangeFilter: false,
        statusLabelsCustomized: true,
      },
      {
        isRequired: true,
        showStatusLabelsFilter: true,
        showDateRangeFilter: true,
        statusLabelsCustomized: false,
      },
    ])
  })

  it("reports a custom status label that was reverted to the default", () => {
    // Arrange
    const before = dateFilter(EVENT_DATE_ID, {
      statusLabels: {
        ...DEFAULT_DATE_FILTER_STATUS_LABELS,
        ENDED: "Closed",
      },
    })
    const after = dateFilter(EVENT_DATE_ID)

    // Act
    const changed = listChangedDateFilters({
      before: [before],
      after: [after],
    })

    // Assert
    expect(changed).toEqual([
      {
        isRequired: false,
        showStatusLabelsFilter: true,
        showDateRangeFilter: true,
        statusLabelsCustomized: false,
      },
    ])
  })

  it("treats a blank status label as customized", () => {
    // Arrange
    const added = dateFilter(EVENT_DATE_ID, {
      statusLabels: {
        ...DEFAULT_DATE_FILTER_STATUS_LABELS,
        UPCOMING: "",
      },
    })

    // Act
    const changed = listChangedDateFilters({
      before: [],
      after: [added],
    })

    // Assert
    expect(changed).toEqual([
      {
        isRequired: false,
        showStatusLabelsFilter: true,
        showDateRangeFilter: true,
        statusLabelsCustomized: true,
      },
    ])
  })
})

describe("getCollectionItemDateProperties", () => {
  const eventDate: CollectionTags[number] = dateFilter(EVENT_DATE_ID)
  const deadline: CollectionTags[number] = dateFilter(DEADLINE_ID, {
    label: "Registration deadline",
  })
  const topic: CollectionTags[number] = topicCategory

  it("returns undefined when the collection has no date filters", () => {
    // Arrange / Act
    const properties = getCollectionItemDateProperties({
      tags: [topic],
      dateTagged: [{ id: TOPIC_ID, date: "2026-01-01", endDate: "2026-01-31" }],
    })

    // Assert
    expect(properties).toBeUndefined()
  })

  it("counts only filled dates that belong to a date filter", () => {
    // Arrange — a blank date that still has an end date, a text-category id,
    // and an unknown id must not increase the filled count or set hasRange.
    const tags: CollectionTags = [eventDate, deadline, topic]

    // Act
    const properties = getCollectionItemDateProperties({
      tags,
      dateTagged: [
        { id: EVENT_DATE_ID, date: "2026-01-01" },
        { id: DEADLINE_ID, date: "", endDate: "2026-06-30" },
        { id: TOPIC_ID, date: "2026-02-01", endDate: "2026-02-28" },
        {
          id: BOOTH_ID,
          date: "2026-03-01",
          endDate: "2026-03-02",
        },
      ],
    })

    // Assert
    expect(properties).toEqual({
      datesFilled: 1,
      dateFilterCount: 2,
      hasRange: false,
    })
  })

  it("sets hasRange when a filled entry has an end date", () => {
    // Arrange — the range is on the second filter, so a first-entry-only check fails.
    const tags: CollectionTags = [eventDate, deadline]

    // Act
    const properties = getCollectionItemDateProperties({
      tags,
      dateTagged: [
        { id: EVENT_DATE_ID, date: "2026-01-01" },
        { id: DEADLINE_ID, date: "2026-06-01", endDate: "2026-06-30" },
      ],
    })

    // Assert
    expect(properties).toEqual({
      datesFilled: 2,
      dateFilterCount: 2,
      hasRange: true,
    })
  })

  it("reports zero filled dates when dateTagged is missing", () => {
    // Arrange / Act
    const properties = getCollectionItemDateProperties({
      tags: [eventDate],
      dateTagged: undefined,
    })

    // Assert
    expect(properties).toEqual({
      datesFilled: 0,
      dateFilterCount: 1,
      hasRange: false,
    })
  })
})

describe("getChangedDateFilterSortDirection", () => {
  const eventDateSort = (direction: "asc" | "desc") =>
    `date-filter-${EVENT_DATE_ID}-${direction}`

  it("returns undefined when the sort order did not change", () => {
    // Arrange
    const order = eventDateSort("desc")

    // Act
    const direction = getChangedDateFilterSortDirection({
      before: order,
      after: order,
    })

    // Assert
    expect(direction).toBeUndefined()
  })

  it("returns undefined when there is no new sort order", () => {
    // Arrange / Act
    const direction = getChangedDateFilterSortDirection({
      before: eventDateSort("desc"),
      after: undefined,
    })

    // Assert
    expect(direction).toBeUndefined()
  })

  it("returns desc when the order changes to an older-first date filter sort", () => {
    // Arrange / Act
    const direction = getChangedDateFilterSortDirection({
      before: eventDateSort("asc"),
      after: eventDateSort("desc"),
    })

    // Assert
    expect(direction).toBe("desc")
  })

  it("returns asc when the order changes to a different date filter", () => {
    // Arrange / Act
    const direction = getChangedDateFilterSortDirection({
      before: COLLECTION_SORT_ORDER.DateDesc,
      after: `date-filter-${DEADLINE_ID}-asc`,
    })

    // Assert
    expect(direction).toBe("asc")
  })

  it("returns undefined when the new order is a built-in sort", () => {
    // Arrange — `date-asc` contains the direction token but is not a date-filter sort.
    // Act
    const direction = getChangedDateFilterSortDirection({
      before: eventDateSort("desc"),
      after: COLLECTION_SORT_ORDER.DateAsc,
    })

    // Assert
    expect(direction).toBeUndefined()
  })

  it("returns undefined when the new order is not a valid date-filter sort", () => {
    // Arrange / Act
    const direction = getChangedDateFilterSortDirection({
      before: COLLECTION_SORT_ORDER.TitleAsc,
      after: "date-filter-not-a-uuid-desc",
    })

    // Assert
    expect(direction).toBeUndefined()
  })
})
