import { describe, expect, it, vi } from "vitest"

import type { AppliedFilter } from "../../../../types/Filter"
import { updateAppliedDateRange } from "../updateAppliedDateRange"

describe("updateAppliedDateRange", () => {
  it("adds a date-range-only applied filter", () => {
    const setAppliedFilters = vi.fn()

    updateAppliedDateRange([], setAppliedFilters, "event-date", {
      start: "2026-01-01",
      end: "2026-03-15",
    })

    expect(setAppliedFilters).toHaveBeenCalledWith([
      {
        id: "event-date",
        items: [],
        dateRange: { start: "2026-01-01", end: "2026-03-15" },
      },
    ])
  })

  it("removes the filter when both range and buckets are cleared", () => {
    const setAppliedFilters = vi.fn()
    const appliedFilters: AppliedFilter[] = [
      {
        id: "event-date",
        items: [],
        dateRange: { start: "2026-01-01", end: "2026-03-15" },
      },
    ]

    updateAppliedDateRange(
      appliedFilters,
      setAppliedFilters,
      "event-date",
      undefined,
    )

    expect(setAppliedFilters).toHaveBeenCalledWith([])
  })
})
