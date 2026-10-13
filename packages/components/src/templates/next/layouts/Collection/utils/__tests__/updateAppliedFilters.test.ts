import { describe, expect, it, vi } from "vitest"

import type { AppliedFilter } from "../../../../types/Filter"
import {
  toggleAppliedFilterItem,
  updateAppliedFilterDateRange,
} from "../updateAppliedFilters"

describe("toggleAppliedFilterItem", () => {
  it("adds a new applied filter when toggling an item on an unapplied filter", () => {
    // Arrange
    const setAppliedFilters = vi.fn()

    // Act
    toggleAppliedFilterItem({
      appliedFilters: [],
      setAppliedFilters,
      filterId: "category",
      itemId: "guides",
    })

    // Assert
    expect(setAppliedFilters).toHaveBeenCalledWith([
      { id: "category", items: [{ id: "guides" }] },
    ])
  })

  it("removes an item from an existing applied filter", () => {
    // Arrange
    const setAppliedFilters = vi.fn()
    const appliedFilters: AppliedFilter[] = [
      { id: "category", items: [{ id: "guides" }, { id: "articles" }] },
    ]

    // Act
    toggleAppliedFilterItem({
      appliedFilters,
      setAppliedFilters,
      filterId: "category",
      itemId: "guides",
    })

    // Assert
    expect(setAppliedFilters).toHaveBeenCalledWith([
      { id: "category", items: [{ id: "articles" }] },
    ])
  })

  it("drops the filter when the last item is removed and no date range is set", () => {
    // Arrange
    const setAppliedFilters = vi.fn()
    const appliedFilters: AppliedFilter[] = [
      { id: "category", items: [{ id: "guides" }] },
    ]

    // Act
    toggleAppliedFilterItem({
      appliedFilters,
      setAppliedFilters,
      filterId: "category",
      itemId: "guides",
    })

    // Assert
    expect(setAppliedFilters).toHaveBeenCalledWith([])
  })

  it("keeps the filter when the last bucket is removed but a date range remains", () => {
    // Arrange
    const setAppliedFilters = vi.fn()
    const appliedFilters: AppliedFilter[] = [
      {
        id: "event-date",
        items: [{ id: "ongoing" }],
        dateRange: { start: "2026-01-01", end: "2026-03-15" },
      },
    ]

    // Act
    toggleAppliedFilterItem({
      appliedFilters,
      setAppliedFilters,
      filterId: "event-date",
      itemId: "ongoing",
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
})

describe("updateAppliedFilterDateRange", () => {
  it("adds an applied filter with only a date range", () => {
    // Arrange
    const setAppliedFilters = vi.fn()

    // Act
    updateAppliedFilterDateRange({
      appliedFilters: [],
      setAppliedFilters,
      filterId: "event-date",
      dateRange: { start: "2026-01-01", end: "2026-03-15" },
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
    updateAppliedFilterDateRange({
      appliedFilters,
      setAppliedFilters,
      filterId: "event-date",
    })

    // Assert
    expect(setAppliedFilters).toHaveBeenCalledWith([])
  })

  it("clears the date range while keeping selected buckets", () => {
    // Arrange
    const setAppliedFilters = vi.fn()
    const appliedFilters: AppliedFilter[] = [
      {
        id: "event-date",
        items: [{ id: "ongoing" }],
        dateRange: { start: "2026-01-01", end: "2026-03-15" },
      },
    ]

    // Act
    updateAppliedFilterDateRange({
      appliedFilters,
      setAppliedFilters,
      filterId: "event-date",
    })

    // Assert
    expect(setAppliedFilters).toHaveBeenCalledWith([
      { id: "event-date", items: [{ id: "ongoing" }], dateRange: undefined },
    ])
  })
})
