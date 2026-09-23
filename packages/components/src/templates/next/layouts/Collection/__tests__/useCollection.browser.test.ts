import type { ProcessedCollectionCardProps } from "~/interfaces"
import type { CollectionPageSchemaType } from "~/types"
import { renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  DATE_FILTER_STATUS,
  DEFAULT_DATE_FILTER_STATUS_LABELS,
  TAG_CATEGORY_TYPE,
} from "~/types/constants"

import type { Filter } from "../../../types/Filter"
import { useCollection } from "../useCollection"

describe("useCollection", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/")
  })

  afterEach(() => {
    window.history.replaceState({}, "", "/")
  })

  describe("appliedFilters", () => {
    it("returns empty array when filters param is absent", () => {
      // Arrange — no filters param in URL (set in beforeEach)

      // Act
      const { result } = renderHook(() => useCollection({ items: [] }))

      // Assert
      expect(result.current.appliedFilters).toEqual([])
    })

    it("returns empty array when filters param is an empty string", () => {
      // Arrange
      window.history.replaceState({}, "", "/?filters=")

      // Act
      const { result } = renderHook(() => useCollection({ items: [] }))

      // Assert
      expect(result.current.appliedFilters).toEqual([])
    })

    it("returns empty array when filters param is an empty JSON array", () => {
      // Arrange
      window.history.replaceState({}, "", "/?filters=%5B%5D")

      // Act
      const { result } = renderHook(() => useCollection({ items: [] }))

      // Assert
      expect(result.current.appliedFilters).toEqual([])
    })

    it("parses valid JSON filters from the URL", () => {
      // Arrange
      const filters = [{ id: "category", items: [{ id: "guides" }] }]
      window.history.replaceState(
        {},
        "",
        `/?filters=${encodeURIComponent(JSON.stringify(filters))}`,
      )

      // Act
      const { result } = renderHook(() => useCollection({ items: [] }))

      // Assert
      expect(result.current.appliedFilters).toEqual(filters)
    })

    it("parses valid JSON filters with a date range from the URL", () => {
      // Arrange
      const filters = [
        {
          id: "event-date",
          items: [],
          dateRange: { start: "2026-01-01", end: "2026-03-15" },
        },
      ]
      window.history.replaceState(
        {},
        "",
        `/?filters=${encodeURIComponent(JSON.stringify(filters))}`,
      )

      // Act
      const { result } = renderHook(() => useCollection({ items: [] }))

      // Assert
      expect(result.current.appliedFilters).toEqual(filters)
    })

    it("parses a From-only date range from the URL", () => {
      // Arrange
      const filters = [
        {
          id: "event-date",
          items: [],
          dateRange: { start: "2026-01-01" },
        },
      ]
      window.history.replaceState(
        {},
        "",
        `/?filters=${encodeURIComponent(JSON.stringify(filters))}`,
      )

      // Act
      const { result } = renderHook(() => useCollection({ items: [] }))

      // Assert
      expect(result.current.appliedFilters).toEqual(filters)
    })

    it.each([
      {
        invalidShape: "filter id is not a string",
        filters: [{ id: 123, items: [] }],
      },
      {
        invalidShape: "filter items is not an array",
        filters: [{ id: "category", items: { id: "guides" } }],
      },
      {
        invalidShape: "filter item id is not a string",
        filters: [{ id: "category", items: [{ id: 123 }] }],
      },
      {
        invalidShape: "dateRange start is not a valid ISO date",
        filters: [
          {
            id: "event-date",
            items: [],
            dateRange: { start: "not-a-date", end: "2026-01-01" },
          },
        ],
      },
      {
        invalidShape: "dateRange end is not a valid ISO date",
        filters: [
          {
            id: "event-date",
            items: [],
            dateRange: { start: "2026-01-01", end: "2026-13-40" },
          },
        ],
      },
    ])("returns empty array when $invalidShape", ({ filters }) => {
      // Arrange
      window.history.replaceState(
        {},
        "",
        `/?filters=${encodeURIComponent(JSON.stringify(filters))}`,
      )

      // Act
      const { result } = renderHook(() => useCollection({ items: [] }))

      // Assert
      expect(result.current.appliedFilters).toEqual([])
    })

    it("returns empty array instead of crashing when filters param is not valid JSON", () => {
      // Arrange — simulates a user manually typing ?filters=hello in the address bar
      window.history.replaceState({}, "", "/?filters=hello")

      // Act
      const { result } = renderHook(() => useCollection({ items: [] }))

      // Assert
      expect(result.current.appliedFilters).toEqual([])
    })

    it("returns empty array instead of crashing for a partial JSON string", () => {
      // Arrange
      window.history.replaceState({}, "", "/?filters=%7B%22id%22")

      // Act
      const { result } = renderHook(() => useCollection({ items: [] }))

      // Assert
      expect(result.current.appliedFilters).toEqual([])
    })
  })

  describe("availableFilters", () => {
    const eventDateFilterId = "event-date-filter-id"
    const todayIso = "2026-06-15"
    const today = "15/06/2026"

    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date(`${todayIso}T12:00:00+08:00`))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it("refreshes date bucket counts from the visitor's Singapore today on load", () => {
      // Arrange — published sidebar still says Upcoming; the event is ongoing today
      const tagCategories: NonNullable<
        CollectionPageSchemaType["page"]["tagCategories"]
      > = [
        {
          id: eventDateFilterId,
          label: "Event Date",
          type: TAG_CATEGORY_TYPE.Date,
          statusLabels: DEFAULT_DATE_FILTER_STATUS_LABELS,
        },
      ]
      const items: ProcessedCollectionCardProps[] = [
        {
          dateTagged: [{ id: eventDateFilterId, date: today }],
        } as ProcessedCollectionCardProps,
      ]
      const filters: Filter[] = [
        {
          id: eventDateFilterId,
          label: "Event Date",
          type: TAG_CATEGORY_TYPE.Date,
          items: [
            {
              id: DATE_FILTER_STATUS.Upcoming.id,
              label: DATE_FILTER_STATUS.Upcoming.defaultLabel,
              count: 1,
            },
          ],
        },
      ]

      // Act
      const { result } = renderHook(() =>
        useCollection({ items, tagCategories, filters }),
      )

      // Assert
      expect(
        result.current.availableFilters[0]?.items.map(({ id }) => id),
      ).toEqual([DATE_FILTER_STATUS.Ongoing.id])
    })
  })
})
