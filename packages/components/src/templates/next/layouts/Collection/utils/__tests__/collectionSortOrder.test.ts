import type { CollectionPagePageProps } from "~/types/page"
import { describe, expect, it } from "vitest"
import { DATE_FILTER_STATUS_ID, TAG_CATEGORY_TYPE } from "~/types/constants"
import { COLLECTION_SORT_ORDER_PATTERN } from "~/utils/validation"

import {
  getCollectionSortOptions,
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
    statusLabels: [
      { id: DATE_FILTER_STATUS_ID.Ended, label: "Event ended" },
      { id: DATE_FILTER_STATUS_ID.Ongoing, label: "Ongoing" },
      { id: DATE_FILTER_STATUS_ID.Upcoming, label: "Upcoming" },
    ],
  },
  {
    id: DEADLINE_FILTER_ID,
    label: "Registration deadline",
    type: TAG_CATEGORY_TYPE.Date,
    isRequired: false,
    statusLabels: [
      { id: DATE_FILTER_STATUS_ID.Ended, label: "Event ended" },
      { id: DATE_FILTER_STATUS_ID.Ongoing, label: "Ongoing" },
      { id: DATE_FILTER_STATUS_ID.Upcoming, label: "Upcoming" },
    ],
  },
]

describe("collectionSortOrder", () => {
  const sortOrderPattern = new RegExp(COLLECTION_SORT_ORDER_PATTERN)

  it("accepts syntactically valid sort orders", () => {
    expect(sortOrderPattern.test("date-desc")).toBe(true)
    expect(sortOrderPattern.test("title-asc")).toBe(true)
    expect(sortOrderPattern.test(`date-filter-${EVENT_FILTER_ID}-desc`)).toBe(
      true,
    )
    expect(sortOrderPattern.test("totally-made-up")).toBe(false)
    expect(sortOrderPattern.test("date-filter-not-a-uuid-desc")).toBe(false)
  })

  it("parses base and date-filter sort orders", () => {
    expect(parseCollectionSortOrder("date-desc")).toEqual({
      kind: "date",
      direction: "desc",
    })
    expect(parseCollectionSortOrder("title-asc")).toEqual({
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

  it("builds base options plus two per date filter", () => {
    expect(getCollectionSortOptions()).toHaveLength(4)

    const options = getCollectionSortOptions(tagCategories)

    expect(options).toHaveLength(8)
    expect(options[4]).toEqual({
      value: `date-filter-${EVENT_FILTER_ID}-desc`,
      label: "By Event date, newest → oldest",
    })
    expect(options[6]).toEqual({
      value: `date-filter-${DEADLINE_FILTER_ID}-desc`,
      label: "By Registration deadline, newest → oldest",
    })
  })

  it("falls back to date-desc for missing or stale sort orders", () => {
    expect(resolveCollectionSortOrder(undefined, tagCategories)).toBe(
      "date-desc",
    )
    expect(
      resolveCollectionSortOrder(`date-filter-${EVENT_FILTER_ID}-desc`, []),
    ).toBe("date-desc")
    expect(
      resolveCollectionSortOrder(
        `date-filter-${DEADLINE_FILTER_ID}-asc`,
        tagCategories,
      ),
    ).toBe(`date-filter-${DEADLINE_FILTER_ID}-asc`)
  })
})
