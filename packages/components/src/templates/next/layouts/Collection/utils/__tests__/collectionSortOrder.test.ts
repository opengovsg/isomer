import type { CollectionPagePageProps } from "~/types/page"
import { describe, expect, it } from "vitest"
import {
  COLLECTION_SORT_ORDER,
  DATE_FILTER_STATUS,
  DEFAULT_COLLECTION_SORT_ORDER,
  TAG_CATEGORY_TYPE,
} from "~/types/constants"
import { COLLECTION_SORT_ORDER_PATTERN } from "~/utils/validation"

import {
  parseCollectionSortOrder,
  resolveCollectionSortOrder,
} from "../collectionSortOrder"

const EVENT_FILTER_ID = "550e8400-e29b-41d4-a716-446655440000"
const DEADLINE_FILTER_ID = "6ba7b810-9dad-11d1-80b4-00c04fd430c8"

const tagCategories: NonNullable<CollectionPagePageProps["tagCategories"]> = [
  {
    id: EVENT_FILTER_ID,
    label: "Event date",
    type: TAG_CATEGORY_TYPE.Date,
    isRequired: false,
    statusLabels: {
      [DATE_FILTER_STATUS.Ended.id]: "Event ended",
      [DATE_FILTER_STATUS.Ongoing.id]: "Ongoing",
      [DATE_FILTER_STATUS.Upcoming.id]: "Upcoming",
    },
  },
  {
    id: DEADLINE_FILTER_ID,
    label: "Registration deadline",
    type: TAG_CATEGORY_TYPE.Date,
    isRequired: false,
    statusLabels: {
      [DATE_FILTER_STATUS.Ended.id]: "Event ended",
      [DATE_FILTER_STATUS.Ongoing.id]: "Ongoing",
      [DATE_FILTER_STATUS.Upcoming.id]: "Upcoming",
    },
  },
]

describe("collectionSortOrder", () => {
  const sortOrderPattern = new RegExp(COLLECTION_SORT_ORDER_PATTERN)

  it("accepts syntactically valid sort orders", () => {
    // Arrange / Act / Assert
    expect(sortOrderPattern.test(COLLECTION_SORT_ORDER.DateDesc)).toBe(true)
    expect(sortOrderPattern.test(COLLECTION_SORT_ORDER.DateAsc)).toBe(true)
    expect(sortOrderPattern.test(COLLECTION_SORT_ORDER.TitleAsc)).toBe(true)
    expect(sortOrderPattern.test(COLLECTION_SORT_ORDER.TitleDesc)).toBe(true)
    expect(sortOrderPattern.test(`date-filter-${EVENT_FILTER_ID}-desc`)).toBe(
      true,
    )
    expect(sortOrderPattern.test("totally-made-up")).toBe(false)
    expect(sortOrderPattern.test("date-filter-not-a-uuid-desc")).toBe(false)
  })

  it("parses base and date-filter sort orders", () => {
    // Arrange / Act / Assert
    expect(parseCollectionSortOrder(COLLECTION_SORT_ORDER.DateDesc)).toEqual({
      kind: "date",
      direction: "desc",
    })
    expect(parseCollectionSortOrder(COLLECTION_SORT_ORDER.TitleAsc)).toEqual({
      kind: "title",
      direction: "asc",
    })
    expect(
      parseCollectionSortOrder(`date-filter-${EVENT_FILTER_ID}-desc`),
    ).toEqual({
      kind: "date-filter",
      filterId: EVENT_FILTER_ID,
      direction: "desc",
    })
  })

  it("parses remaining base and date-filter directions", () => {
    // Arrange / Act / Assert
    expect(parseCollectionSortOrder(COLLECTION_SORT_ORDER.DateAsc)).toEqual({
      kind: "date",
      direction: "asc",
    })
    expect(parseCollectionSortOrder(COLLECTION_SORT_ORDER.TitleDesc)).toEqual({
      kind: "title",
      direction: "desc",
    })
    expect(
      parseCollectionSortOrder(`date-filter-${EVENT_FILTER_ID}-asc`),
    ).toEqual({
      kind: "date-filter",
      filterId: EVENT_FILTER_ID,
      direction: "asc",
    })
  })

  it("falls back to date-desc when sortOrder is missing or malformed", () => {
    // Arrange / Act / Assert
    expect(parseCollectionSortOrder(undefined)).toEqual({
      kind: "date",
      direction: "desc",
    })
    expect(parseCollectionSortOrder("totally-made-up")).toEqual({
      kind: "date",
      direction: "desc",
    })
    expect(parseCollectionSortOrder("date-filter-not-a-uuid-desc")).toEqual({
      kind: "date",
      direction: "desc",
    })
    expect(parseCollectionSortOrder("DATE-DESC")).toEqual({
      kind: "date",
      direction: "desc",
    })
  })

  it("falls back to date-desc for missing, malformed, or stale sort orders", () => {
    // Arrange / Act / Assert
    expect(resolveCollectionSortOrder(undefined, tagCategories)).toBe(
      DEFAULT_COLLECTION_SORT_ORDER,
    )
    expect(resolveCollectionSortOrder("totally-made-up", tagCategories)).toBe(
      DEFAULT_COLLECTION_SORT_ORDER,
    )
    expect(
      resolveCollectionSortOrder(`date-filter-${EVENT_FILTER_ID}-desc`, []),
    ).toBe(DEFAULT_COLLECTION_SORT_ORDER)
    expect(
      resolveCollectionSortOrder(
        `date-filter-${EVENT_FILTER_ID}-desc`,
        undefined,
      ),
    ).toBe(DEFAULT_COLLECTION_SORT_ORDER)
    expect(
      resolveCollectionSortOrder(
        `date-filter-${DEADLINE_FILTER_ID}-asc`,
        tagCategories,
      ),
    ).toBe(`date-filter-${DEADLINE_FILTER_ID}-asc`)
  })

  it("keeps every base sort order unchanged when tagCategories is provided", () => {
    // Arrange / Act / Assert
    expect(
      resolveCollectionSortOrder(COLLECTION_SORT_ORDER.DateDesc, tagCategories),
    ).toBe(COLLECTION_SORT_ORDER.DateDesc)
    expect(
      resolveCollectionSortOrder(COLLECTION_SORT_ORDER.DateAsc, tagCategories),
    ).toBe(COLLECTION_SORT_ORDER.DateAsc)
    expect(
      resolveCollectionSortOrder(COLLECTION_SORT_ORDER.TitleAsc, tagCategories),
    ).toBe(COLLECTION_SORT_ORDER.TitleAsc)
    expect(
      resolveCollectionSortOrder(
        COLLECTION_SORT_ORDER.TitleDesc,
        tagCategories,
      ),
    ).toBe(COLLECTION_SORT_ORDER.TitleDesc)
  })

  it("falls back when the date-filter UUID is absent from a populated tagCategories list", () => {
    // Arrange
    const unknownFilterId = "00000000-0000-0000-0000-000000000000"

    // Act
    const result = resolveCollectionSortOrder(
      `date-filter-${unknownFilterId}-desc`,
      tagCategories,
    )

    // Assert
    expect(result).toBe(DEFAULT_COLLECTION_SORT_ORDER)
  })
})
