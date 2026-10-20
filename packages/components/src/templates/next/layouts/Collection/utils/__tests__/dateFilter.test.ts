import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { getDateFilterCardsFromEntries } from "~/templates/next/components/internal/CollectionCard/utils/getDateFilterCardsFromEntries"
import {
  DATE_FILTER_STATUS,
  DEFAULT_DATE_FILTER_STATUS_LABELS,
} from "~/types/constants"

import { buildDateFilterStatusLabels } from "../buildDateFilterStatusLabels"
import { getDateFilterDisplayEntries } from "../getDateFilterDisplayEntries"

const EVENT_DATE_FILTER_ID = "11111111-1111-1111-1111-111111111111"

const tagCategories = [
  {
    id: EVENT_DATE_FILTER_ID,
    label: "Event Date",
    type: "date" as const,
    statusLabels: DEFAULT_DATE_FILTER_STATUS_LABELS,
  },
]

describe("getDateFilterDisplayEntries", () => {
  it("returns undefined when the item has no date filter values", () => {
    expect(getDateFilterDisplayEntries(undefined, tagCategories)).toEqual({
      dateFilterDisplayEntries: undefined,
    })
  })

  it("returns static entries with status labels and no live status", () => {
    const result = getDateFilterDisplayEntries(
      [{ id: EVENT_DATE_FILTER_ID, date: "2026-09-27" }],
      tagCategories,
    )

    expect(result).toEqual({
      dateFilterDisplayEntries: [
        {
          id: EVENT_DATE_FILTER_ID,
          label: "Event Date",
          dateText: "27 Sep 2026",
          date: "2026-09-27",
          statusLabels: buildDateFilterStatusLabels(
            tagCategories[0]!.statusLabels,
          ),
        },
      ],
    })
  })

  it("drops orphaned entries whose filter no longer exists", () => {
    expect(
      getDateFilterDisplayEntries(
        [{ id: "deleted-filter-id", date: "2026-06-15" }],
        tagCategories,
      ),
    ).toEqual({ dateFilterDisplayEntries: undefined })
  })

  it("formats a same-year range without repeating the year", () => {
    const result = getDateFilterDisplayEntries(
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
    const result = getDateFilterDisplayEntries(
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
    const result = getDateFilterDisplayEntries(
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
  const TODAY = "2026-06-15"

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(`${TODAY}T12:00:00+08:00`))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("resolves live status and admin label from static entries", () => {
    const entries = getDateFilterDisplayEntries(
      [{ id: EVENT_DATE_FILTER_ID, date: TODAY }],
      tagCategories,
    ).dateFilterDisplayEntries!

    expect(getDateFilterCardsFromEntries(entries)).toEqual([
      {
        id: EVENT_DATE_FILTER_ID,
        label: "Event Date",
        date: TODAY,
        endDate: undefined,
        status: DATE_FILTER_STATUS.Ongoing.id,
        statusLabel: DATE_FILTER_STATUS.Ongoing.defaultLabel,
        dateText: "15 Jun 2026",
      },
    ])
  })
})
