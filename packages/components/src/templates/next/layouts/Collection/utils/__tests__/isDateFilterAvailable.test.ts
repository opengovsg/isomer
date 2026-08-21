import { describe, expect, it } from "vitest"

import type { Filter } from "../../../../types/Filter"
import {
  isAvailableFilter,
  isDateFilterAvailable,
} from "../isDateFilterAvailable"

const dateFilter = (overrides: Partial<Filter> = {}): Filter => ({
  id: "event-date-filter-id",
  label: "Event Date",
  type: "date",
  showStatusLabels: true,
  showDateRange: true,
  items: [{ id: "ONGOING", label: "Ongoing", count: 1 }],
  ...overrides,
})

describe("isDateFilterAvailable", () => {
  it("returns false for non-date filters", () => {
    expect(
      isDateFilterAvailable({
        id: "Category",
        label: "Category",
        items: [{ id: "Guides", label: "Guides", count: 1 }],
      }),
    ).toBe(false)
  })

  it("returns true when status labels have counts and both controls are enabled", () => {
    expect(isDateFilterAvailable(dateFilter())).toBe(true)
  })

  it("returns true when only the date-range control is enabled", () => {
    expect(
      isDateFilterAvailable(dateFilter({ showStatusLabels: false, items: [] })),
    ).toBe(true)
  })

  it("returns false when both controls are disabled", () => {
    expect(
      isDateFilterAvailable(
        dateFilter({ showStatusLabels: false, showDateRange: false }),
      ),
    ).toBe(false)
  })
})

describe("isAvailableFilter", () => {
  it("delegates date filters to isDateFilterAvailable", () => {
    expect(
      isAvailableFilter(dateFilter({ showDateRange: false, items: [] })),
    ).toBe(false)
  })

  it("requires at least one item for text filters", () => {
    expect(
      isAvailableFilter({
        id: "Category",
        label: "Category",
        items: [],
      }),
    ).toBe(false)
  })
})
