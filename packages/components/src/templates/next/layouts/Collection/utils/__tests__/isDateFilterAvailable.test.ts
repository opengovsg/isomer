import { describe, expect, it } from "vitest"
import { DEFAULT_DATE_FILTER_SIDEBAR_VISIBILITY } from "~/types/constants"

import type { Filter } from "../../../../types/Filter"
import {
  isAvailableFilter,
  isDateFilterAvailable,
} from "../isDateFilterAvailable"

const dateFilter = (overrides: Partial<Filter> = {}): Filter => ({
  id: "event-date-filter-id",
  label: "Event Date",
  type: "date",
  showStatusLabelsFilter:
    DEFAULT_DATE_FILTER_SIDEBAR_VISIBILITY.showStatusLabelsFilter,
  showDateRangeFilter:
    DEFAULT_DATE_FILTER_SIDEBAR_VISIBILITY.showDateRangeFilter,
  items: [{ id: "ONGOING", label: "Ongoing", count: 1 }],
  dateTaggedItemCount: 1,
  ...overrides,
})

describe("isDateFilterAvailable", () => {
  it("returns false for non-date filters", () => {
    // Arrange
    const filter = {
      id: "Category",
      label: "Category",
      items: [{ id: "Guides", label: "Guides", count: 1 }],
    }

    // Act
    const result = isDateFilterAvailable(filter)

    // Assert
    expect(result).toBe(false)
  })

  it("returns true when status labels have counts and both controls are enabled", () => {
    // Arrange
    const filter = dateFilter()

    // Act
    const result = isDateFilterAvailable(filter)

    // Assert
    expect(result).toBe(true)
  })

  it("returns true when only the date-range control is enabled and cards have dates", () => {
    // Arrange
    const filter = dateFilter({
      showStatusLabelsFilter: false,
      items: [],
      dateTaggedItemCount: 2,
    })

    // Act
    const result = isDateFilterAvailable(filter)

    // Assert
    expect(result).toBe(true)
  })

  it("returns false when only the date-range control is enabled but no cards have dates", () => {
    // Arrange
    const filter = dateFilter({
      showStatusLabelsFilter: false,
      items: [],
      dateTaggedItemCount: 0,
    })

    // Act
    const result = isDateFilterAvailable(filter)

    // Assert
    expect(result).toBe(false)
  })

  it("returns true when both controls are enabled, buckets are empty, but cards have dates", () => {
    // Arrange — blank status labels can yield items: [] while dateTaggedItemCount > 0
    const filter = dateFilter({ items: [], dateTaggedItemCount: 3 })

    // Act
    const result = isDateFilterAvailable(filter)

    // Assert
    expect(result).toBe(true)
  })

  it("returns false when only status labels are enabled and no buckets have counts", () => {
    // Arrange
    const filter = dateFilter({
      items: [],
      dateTaggedItemCount: 3,
      showDateRangeFilter: false,
    })

    // Act
    const result = isDateFilterAvailable(filter)

    // Assert
    expect(result).toBe(false)
  })

  it("returns false when both controls are disabled", () => {
    // Arrange
    const filter = dateFilter({
      showStatusLabelsFilter: false,
      showDateRangeFilter: false,
    })

    // Act
    const result = isDateFilterAvailable(filter)

    // Assert
    expect(result).toBe(false)
  })
})

describe("isAvailableFilter", () => {
  it("delegates date filters to isDateFilterAvailable", () => {
    // Arrange
    const filter = dateFilter({
      showDateRangeFilter: false,
      items: [],
      dateTaggedItemCount: 0,
    })

    // Act
    const result = isAvailableFilter(filter)

    // Assert
    expect(result).toBe(false)
  })

  it("requires at least one item for text filters", () => {
    // Arrange
    const filter = {
      id: "Category",
      label: "Category",
      items: [],
    }

    // Act
    const result = isAvailableFilter(filter)

    // Assert
    expect(result).toBe(false)
  })
})
