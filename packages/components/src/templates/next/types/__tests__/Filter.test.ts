import { describe, expect, it } from "vitest"

import { isAppliedFilters, isIsoDateString } from "../Filter"

describe("isIsoDateString", () => {
  it.each(["2026-01-01", "2026-12-31"])("accepts %s", (value) => {
    expect(isIsoDateString(value)).toBe(true)
  })

  it.each(["not-a-date", "2026-13-01", "2026-00-15", "26-01-01", ""])(
    "rejects %s",
    (value) => {
      expect(isIsoDateString(value)).toBe(false)
    },
  )
})

describe("isAppliedFilters", () => {
  it("rejects a dateRange with invalid ISO date strings", () => {
    expect(
      isAppliedFilters([
        {
          id: "event-date",
          items: [],
          dateRange: { start: "not-a-date", end: "2026-01-01" },
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
