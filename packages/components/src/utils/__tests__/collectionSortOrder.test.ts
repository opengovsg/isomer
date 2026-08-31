import type { CollectionPagePageProps } from "~/types/page"
import { describe, expect, it } from "vitest"
import { DATE_FILTER_STATUS_ID, TAG_CATEGORY_TYPE } from "~/types/constants"

import {
  DEFAULT_COLLECTION_SORT_ORDER,
  encodeDateFilterSortOrder,
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
  describe("parseCollectionSortOrder", () => {
    it("parses base sort orders", () => {
      expect(parseCollectionSortOrder("date-desc")).toEqual({
        kind: "date",
        direction: "desc",
      })
      expect(parseCollectionSortOrder("title-asc")).toEqual({
        kind: "title",
        direction: "asc",
      })
    })

    it("parses date-filter sort orders with UUIDs", () => {
      const sortOrder = encodeDateFilterSortOrder(EVENT_FILTER_ID, "desc")

      expect(parseCollectionSortOrder(sortOrder)).toEqual({
        kind: "date-filter",
        filterId: EVENT_FILTER_ID,
        direction: "desc",
      })
    })
  })

  describe("getCollectionSortOptions", () => {
    it("returns only base options when there are no date filters", () => {
      expect(getCollectionSortOptions()).toHaveLength(4)
      expect(getCollectionSortOptions([])).toHaveLength(4)
    })

    it("appends two options per date filter in tagCategories order", () => {
      const options = getCollectionSortOptions(tagCategories)

      expect(options).toHaveLength(8)
      expect(options[4]).toEqual({
        value: encodeDateFilterSortOrder(EVENT_FILTER_ID, "desc"),
        label: "By Event date, newest → oldest",
      })
      expect(options[5]).toEqual({
        value: encodeDateFilterSortOrder(EVENT_FILTER_ID, "asc"),
        label: "By Event date, oldest → newest",
      })
      expect(options[6]).toEqual({
        value: encodeDateFilterSortOrder(DEADLINE_FILTER_ID, "desc"),
        label: "By Registration deadline, newest → oldest",
      })
    })
  })

  describe("resolveCollectionSortOrder", () => {
    it("falls back to date-desc when sort order is missing", () => {
      expect(resolveCollectionSortOrder(undefined, tagCategories)).toBe(
        DEFAULT_COLLECTION_SORT_ORDER,
      )
    })

    it("falls back to date-desc when the referenced date filter was removed", () => {
      const sortOrder = encodeDateFilterSortOrder(EVENT_FILTER_ID, "desc")

      expect(resolveCollectionSortOrder(sortOrder, [])).toBe(
        DEFAULT_COLLECTION_SORT_ORDER,
      )
    })

    it("keeps a valid date-filter sort order", () => {
      const sortOrder = encodeDateFilterSortOrder(DEADLINE_FILTER_ID, "asc")

      expect(resolveCollectionSortOrder(sortOrder, tagCategories)).toBe(
        sortOrder,
      )
    })
  })
})
