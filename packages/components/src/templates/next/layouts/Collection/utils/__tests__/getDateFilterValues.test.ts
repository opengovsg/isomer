import { describe, expect, it } from "vitest"

import {
  getDateFilterStaticEntries,
  getDateFilterValues,
} from "../getDateFilterValues"

const EVENT_DATE_FILTER_ID = "11111111-1111-1111-1111-111111111111"

const tagCategories = [
  {
    id: EVENT_DATE_FILTER_ID,
    label: "Event Date",
    type: "date" as const,
    statusLabels: [
      { id: "ENDED" as const, label: "Event ended" },
      { id: "ONGOING" as const, label: "Ongoing" },
      { id: "UPCOMING" as const, label: "Upcoming" },
    ],
  },
]

describe("getDateFilterValues", () => {
  it("returns undefined when the item has no date filter values", () => {
    expect(getDateFilterStaticEntries(undefined, tagCategories)).toBeUndefined()
  })

  it("returns static entries without status", () => {
    const result = getDateFilterStaticEntries(
      [{ id: EVENT_DATE_FILTER_ID, date: "2026-09-27" }],
      tagCategories,
    )

    expect(result).toEqual([
      {
        id: EVENT_DATE_FILTER_ID,
        label: "Event Date",
        dateText: "27 Sep 2026",
        date: "2026-09-27",
      },
    ])
  })

  it("returns undefined for both fields when the item has no date filter values", () => {
    expect(getDateFilterValues(undefined, tagCategories, "2026-06-15")).toEqual(
      {
        dateTagged: undefined,
        dateFilterCards: undefined,
      },
    )
  })

  it("resolves a single-date value into a card entry", () => {
    const result = getDateFilterValues(
      [{ id: EVENT_DATE_FILTER_ID, date: "2026-06-15" }],
      tagCategories,
      "2026-06-15",
    )

    expect(result.dateTagged).toEqual([
      { id: EVENT_DATE_FILTER_ID, date: "2026-06-15" },
    ])
    expect(result.dateFilterCards).toEqual([
      {
        id: EVENT_DATE_FILTER_ID,
        label: "Event Date",
        date: "2026-06-15",
        endDate: undefined,
        status: "ONGOING",
        statusLabel: "Ongoing",
        dateText: "15 Jun 2026",
      },
    ])
  })

  it("formats a same-year range without repeating the year", () => {
    const result = getDateFilterValues(
      [
        {
          id: EVENT_DATE_FILTER_ID,
          date: "2026-09-27",
          endDate: "2026-09-29",
        },
      ],
      tagCategories,
      "2026-01-01",
    )

    expect(result.dateFilterCards?.[0]?.dateText).toEqual(
      "27 Sep - 29 Sep 2026",
    )
  })

  it("formats a range where date and endDate are the same day as a single date", () => {
    const result = getDateFilterValues(
      [
        {
          id: EVENT_DATE_FILTER_ID,
          date: "2026-08-04",
          endDate: "2026-08-04",
        },
      ],
      tagCategories,
      "2026-01-01",
    )

    expect(result.dateFilterCards?.[0]?.dateText).toEqual("4 Aug 2026")
  })

  it("formats a cross-year range with the year on both sides", () => {
    const result = getDateFilterValues(
      [
        {
          id: EVENT_DATE_FILTER_ID,
          date: "2025-07-27",
          endDate: "2026-10-25",
        },
      ],
      tagCategories,
      "2026-01-01",
    )

    expect(result.dateFilterCards?.[0]?.dateText).toEqual(
      "27 Jul 2025 - 25 Oct 2026",
    )
  })

  it("drops orphaned entries whose filter no longer exists", () => {
    const result = getDateFilterValues(
      [{ id: "deleted-filter-id", date: "2026-06-15" }],
      tagCategories,
      "2026-06-15",
    )

    expect(result).toEqual({
      dateTagged: undefined,
      dateFilterCards: undefined,
    })
  })
})
