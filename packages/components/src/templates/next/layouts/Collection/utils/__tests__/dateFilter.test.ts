import { describe, expect, it } from "vitest"

import { getDateFilterCardsFromEntries } from "../dateFilterCards"
import { resolveItemDateFields } from "../dateFilterStatic"

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

describe("resolveItemDateFields", () => {
  it("returns empty fields when the item has no date filter values", () => {
    expect(resolveItemDateFields(undefined, tagCategories)).toEqual({})
  })

  it("returns static entries with status labels and no live status", () => {
    const result = resolveItemDateFields(
      [{ id: EVENT_DATE_FILTER_ID, date: "2026-09-27" }],
      tagCategories,
    )

    expect(result).toEqual({
      dateTagged: [{ id: EVENT_DATE_FILTER_ID, date: "2026-09-27" }],
      dateFilterDisplayEntries: [
        {
          id: EVENT_DATE_FILTER_ID,
          label: "Event Date",
          dateText: "27 Sep 2026",
          date: "2026-09-27",
          statusLabels: tagCategories[0]!.statusLabels,
        },
      ],
    })
  })

  it("drops orphaned entries whose filter no longer exists", () => {
    expect(
      resolveItemDateFields(
        [{ id: "deleted-filter-id", date: "2026-06-15" }],
        tagCategories,
      ),
    ).toEqual({})
  })

  it("formats a same-year range without repeating the year", () => {
    const result = resolveItemDateFields(
      [
        {
          id: EVENT_DATE_FILTER_ID,
          date: "2026-09-27",
          endDate: "2026-09-29",
        },
      ],
      tagCategories,
    )

    expect(result.dateFilterDisplayEntries?.[0]?.dateText).toEqual(
      "27 Sep - 29 Sep 2026",
    )
  })

  it("formats a range where date and endDate are the same day as a single date", () => {
    const result = resolveItemDateFields(
      [
        {
          id: EVENT_DATE_FILTER_ID,
          date: "2026-08-04",
          endDate: "2026-08-04",
        },
      ],
      tagCategories,
    )

    expect(result.dateFilterDisplayEntries?.[0]?.dateText).toEqual("4 Aug 2026")
  })

  it("formats a cross-year range with the year on both sides", () => {
    const result = resolveItemDateFields(
      [
        {
          id: EVENT_DATE_FILTER_ID,
          date: "2025-07-27",
          endDate: "2026-10-25",
        },
      ],
      tagCategories,
    )

    expect(result.dateFilterDisplayEntries?.[0]?.dateText).toEqual(
      "27 Jul 2025 - 25 Oct 2026",
    )
  })
})

describe("getDateFilterCardsFromEntries", () => {
  it("resolves live status and admin label from static entries", () => {
    const entries = resolveItemDateFields(
      [{ id: EVENT_DATE_FILTER_ID, date: "2026-06-15" }],
      tagCategories,
    ).dateFilterDisplayEntries!

    expect(getDateFilterCardsFromEntries(entries, "2026-06-15")).toEqual([
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
})
