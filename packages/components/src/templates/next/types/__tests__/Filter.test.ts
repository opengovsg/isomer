import { describe, expect, it } from "vitest"

import { isAppliedFilters } from "../Filter"

const dateRangeFilter = (dateRange: { start?: string; end?: string }) => [
  {
    id: "event-date",
    items: [],
    dateRange,
  },
]

describe("isAppliedFilters", () => {
  it.each([
    "not-a-date",
    "2026-02-30",
    "2026-13-01",
    "2026-00-15",
    "26-01-01",
    "",
  ])("rejects a dateRange with invalid start date %s", (start) => {
    // Arrange / Act / Assert
    expect(
      isAppliedFilters(dateRangeFilter({ start, end: "2026-01-01" })),
    ).toBe(false)
  })

  it.each(["not-a-date", "2026-02-30", "2026-13-01"])(
    "rejects a dateRange with invalid end date %s",
    (end) => {
      // Arrange / Act / Assert
      expect(
        isAppliedFilters(dateRangeFilter({ start: "2026-01-01", end })),
      ).toBe(false)
    },
  )

  it("rejects a dateRange where start is after end", () => {
    // Arrange / Act / Assert
    expect(
      isAppliedFilters(
        dateRangeFilter({ start: "2026-03-01", end: "2026-02-01" }),
      ),
    ).toBe(false)
  })

  it("accepts a dateRange with valid ISO calendar dates", () => {
    // Arrange / Act / Assert
    expect(
      isAppliedFilters(
        dateRangeFilter({ start: "2026-01-01", end: "2026-03-15" }),
      ),
    ).toBe(true)
  })

  it("accepts a dateRange with only a start date", () => {
    // Arrange / Act / Assert
    expect(isAppliedFilters(dateRangeFilter({ start: "2026-01-01" }))).toBe(
      true,
    )
  })

  it("accepts a dateRange with only an end date", () => {
    // Arrange / Act / Assert
    expect(isAppliedFilters(dateRangeFilter({ end: "2026-03-15" }))).toBe(true)
  })

  it("rejects a dateRange with neither start nor end", () => {
    // Arrange / Act / Assert
    expect(isAppliedFilters(dateRangeFilter({}))).toBe(false)
  })
})
