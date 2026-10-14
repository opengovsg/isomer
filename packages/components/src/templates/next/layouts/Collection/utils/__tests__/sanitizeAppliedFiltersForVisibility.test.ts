import type { AppliedFilter } from "~/templates/next/types/Filter"
import type { CollectionPagePageProps } from "~/types"
import { describe, expect, it } from "vitest"
import { DEFAULT_DATE_FILTER_STATUS_LABELS } from "~/types/constants"

import { sanitizeAppliedFiltersForVisibility } from "../sanitizeAppliedFiltersForVisibility"

const EVENT_DATE_FILTER_ID = "event-date-filter-id"

const dateFilterCategory = {
  id: EVENT_DATE_FILTER_ID,
  label: "Event Date",
  type: "date" as const,
  showStatusLabelsFilter: true,
  showDateRangeFilter: false,
  statusLabels: DEFAULT_DATE_FILTER_STATUS_LABELS,
}

describe("sanitizeAppliedFiltersForVisibility", () => {
  it("returns applied filters unchanged when tag categories are absent", () => {
    // Arrange
    const appliedFilters: AppliedFilter[] = [
      {
        id: EVENT_DATE_FILTER_ID,
        items: [{ id: "ONGOING" }],
        dateRange: { start: "2026-01-01", end: "2026-03-31" },
      },
    ]

    // Act
    const result = sanitizeAppliedFiltersForVisibility(appliedFilters)

    // Assert
    expect(result).toEqual(appliedFilters)
  })

  it("drops hidden status-label buckets from a date filter", () => {
    // Arrange
    const appliedFilters: AppliedFilter[] = [
      {
        id: EVENT_DATE_FILTER_ID,
        items: [{ id: "ONGOING" }],
        dateRange: { start: "2026-01-01", end: "2026-03-31" },
      },
    ]
    const tagCategories = [
      {
        ...dateFilterCategory,
        showStatusLabelsFilter: false,
        showDateRangeFilter: true,
      },
    ] satisfies NonNullable<CollectionPagePageProps["tagCategories"]>

    // Act
    const result = sanitizeAppliedFiltersForVisibility(
      appliedFilters,
      tagCategories,
    )

    // Assert
    expect(result).toEqual([
      {
        id: EVENT_DATE_FILTER_ID,
        items: [],
        dateRange: { start: "2026-01-01", end: "2026-03-31" },
      },
    ])
  })

  it("drops hidden date ranges from a date filter", () => {
    // Arrange
    const appliedFilters: AppliedFilter[] = [
      {
        id: EVENT_DATE_FILTER_ID,
        items: [{ id: "ONGOING" }],
        dateRange: { start: "2026-01-01", end: "2026-03-31" },
      },
    ]
    const tagCategories = [
      {
        ...dateFilterCategory,
        showStatusLabelsFilter: true,
        showDateRangeFilter: false,
      },
    ] satisfies NonNullable<CollectionPagePageProps["tagCategories"]>

    // Act
    const result = sanitizeAppliedFiltersForVisibility(
      appliedFilters,
      tagCategories,
    )

    // Assert
    expect(result).toEqual([
      {
        id: EVENT_DATE_FILTER_ID,
        items: [{ id: "ONGOING" }],
      },
    ])
  })

  it("removes a date filter when both controls are hidden", () => {
    // Arrange
    const appliedFilters: AppliedFilter[] = [
      {
        id: EVENT_DATE_FILTER_ID,
        items: [{ id: "ONGOING" }],
        dateRange: { start: "2026-01-01", end: "2026-03-31" },
      },
    ]
    const tagCategories = [
      {
        ...dateFilterCategory,
        showStatusLabelsFilter: false,
        showDateRangeFilter: false,
      },
    ] satisfies NonNullable<CollectionPagePageProps["tagCategories"]>

    // Act
    const result = sanitizeAppliedFiltersForVisibility(
      appliedFilters,
      tagCategories,
    )

    // Assert
    expect(result).toEqual([])
  })
})
