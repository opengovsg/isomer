import { describe, expect, it } from "vitest"

import { isAppliedFilters } from "../Filter"

describe("isAppliedFilters", () => {
  it.each(["not-a-date", "2026-13-01", "2026-00-15", "26-01-01", ""])(
    "rejects a dateRange with invalid start date %s",
    (start) => {
      expect(
        isAppliedFilters([
          {
            id: "event-date",
            items: [],
            dateRange: { start, end: "2026-01-01" },
          },
        ]),
      ).toBe(false)
    },
  )

  it("rejects a dateRange with invalid end date", () => {
    expect(
      isAppliedFilters([
        {
          id: "event-date",
          items: [],
          dateRange: { start: "2026-01-01", end: "not-a-date" },
        },
      ]),
    ).toBe(false)
  })

  it("accepts a dateRange with valid ISO date strings", () => {
    expect(
      isAppliedFilters([
        {
          id: "event-date",
          items: [],
          dateRange: { start: "2026-01-01", end: "2026-03-15" },
        },
      ]),
    ).toBe(true)
  })
})
