import { describe, expect, it, vi } from "vitest"

import type { AppliedFilter } from "../../../../types/Filter"
import { updateAppliedFilters } from "../updateAppliedFilters"

describe("updateAppliedFilters", () => {
  it("adds an applied filter with only a date range", () => {
    // Arrange
    const setAppliedFilters = vi.fn()

    // Act
    updateAppliedFilters([], setAppliedFilters, "event-date", {
      start: "2026-01-01",
      end: "2026-03-15",
    })

    // Assert
    expect(setAppliedFilters).toHaveBeenCalledWith([
      {
        id: "event-date",
        items: [],
        dateRange: { start: "2026-01-01", end: "2026-03-15" },
      },
    ])
  })

  it("drops the filter when the date range and buckets are both cleared", () => {
    // Arrange
    const setAppliedFilters = vi.fn()
    const appliedFilters: AppliedFilter[] = [
      {
        id: "event-date",
        items: [],
        dateRange: { start: "2026-01-01", end: "2026-03-15" },
      },
    ]

    // Act
    updateAppliedFilters(
      appliedFilters,
      setAppliedFilters,
      "event-date",
      undefined,
    )

    // Assert
    expect(setAppliedFilters).toHaveBeenCalledWith([])
  })
})
