import type { ProcessedCollectionCardProps } from "~/interfaces"
import type { AppliedFilter } from "~/templates/next/types/Filter"
import type { CollectionPagePageProps } from "~/types"
import { describe, expect, it } from "vitest"

import { NO_SPECIFIED_YEAR_FILTER_ID } from "../constants"
import { getFilteredItems } from "../getFilteredItems"

describe("getFilteredItems", () => {
  it("returns all items when there is no search value and no applied filters", () => {
    // Arrange
    const items: ProcessedCollectionCardProps[] = [
      { title: "A", description: "" } as ProcessedCollectionCardProps,
      { title: "B", description: "" } as ProcessedCollectionCardProps,
    ]

    // Act
    const result = getFilteredItems(items, [], "")

    // Assert
    expect(result).toEqual(items)
  })

  it("filters by search value matching the title, case-insensitively", () => {
    // Arrange
    const items: ProcessedCollectionCardProps[] = [
      {
        title: "Guide to Isomer",
        description: "",
      } as ProcessedCollectionCardProps,
      {
        title: "Something else",
        description: "",
      } as ProcessedCollectionCardProps,
    ]

    // Act
    const result = getFilteredItems(items, [], "isomer")

    // Assert
    expect(result).toEqual([items[0]])
  })

  it("filters by search value matching the description", () => {
    // Arrange
    const items: ProcessedCollectionCardProps[] = [
      {
        title: "A",
        description: "Contains keyword here",
      } as ProcessedCollectionCardProps,
      { title: "B", description: "No match" } as ProcessedCollectionCardProps,
    ]

    // Act
    const result = getFilteredItems(items, [], "keyword")

    // Assert
    expect(result).toEqual([items[0]])
  })

  it("filters by year matching the item's date", () => {
    // Arrange
    const items: ProcessedCollectionCardProps[] = [
      {
        title: "A",
        description: "",
        date: new Date("2023-05-01"),
      } as ProcessedCollectionCardProps,
      {
        title: "B",
        description: "",
        date: new Date("2022-05-01"),
      } as ProcessedCollectionCardProps,
    ]
    const appliedFilters: AppliedFilter[] = [
      { id: "year", items: [{ id: "2023" }] },
    ]

    // Act
    const result = getFilteredItems(items, appliedFilters, "")

    // Assert
    expect(result).toEqual([items[0]])
  })

  it("filters items with no date via the 'not specified' year option", () => {
    // Arrange
    const items: ProcessedCollectionCardProps[] = [
      {
        title: "A",
        description: "",
        date: undefined,
      } as ProcessedCollectionCardProps,
      {
        title: "B",
        description: "",
        date: new Date("2022-05-01"),
      } as ProcessedCollectionCardProps,
    ]
    const appliedFilters: AppliedFilter[] = [
      { id: "year", items: [{ id: NO_SPECIFIED_YEAR_FILTER_ID }] },
    ]

    // Act
    const result = getFilteredItems(items, appliedFilters, "")

    // Assert
    expect(result).toEqual([items[0]])
  })

  it("filters a migrated 'Category' group exactly like any other tag category (OR within group)", () => {
    // Arrange
    const items: ProcessedCollectionCardProps[] = [
      {
        title: "A",
        description: "",
        tags: [{ selected: ["Guides"], category: "Category" }],
      } as ProcessedCollectionCardProps,
      {
        title: "B",
        description: "",
        tags: [{ selected: ["Articles"], category: "Category" }],
      } as ProcessedCollectionCardProps,
      {
        title: "C",
        description: "",
        tags: [{ selected: ["Tutorials"], category: "Category" }],
      } as ProcessedCollectionCardProps,
    ]
    const appliedFilters: AppliedFilter[] = [
      { id: "Category", items: [{ id: "Guides" }, { id: "Articles" }] },
    ]

    // Act
    const result = getFilteredItems(items, appliedFilters, "")

    // Assert
    expect(result).toEqual([items[0], items[1]])
  })

  it("applies AND semantics across different filter groups, including a migrated Category group", () => {
    // Arrange
    const items: ProcessedCollectionCardProps[] = [
      {
        title: "A",
        description: "",
        tags: [
          { selected: ["Guides"], category: "Category" },
          { selected: ["Health"], category: "Topic" },
        ],
      } as ProcessedCollectionCardProps,
      {
        title: "B",
        description: "",
        tags: [
          { selected: ["Guides"], category: "Category" },
          { selected: ["Finance"], category: "Topic" },
        ],
      } as ProcessedCollectionCardProps,
    ]
    const appliedFilters: AppliedFilter[] = [
      { id: "Category", items: [{ id: "Guides" }] },
      { id: "Topic", items: [{ id: "Health" }] },
    ]

    // Act
    const result = getFilteredItems(items, appliedFilters, "")

    // Assert
    expect(result).toEqual([items[0]])
  })

  it("excludes items that have no tags at all when a tag filter is applied", () => {
    // Arrange
    const items: ProcessedCollectionCardProps[] = [
      {
        title: "A",
        description: "",
        tags: undefined,
      } as ProcessedCollectionCardProps,
    ]
    const appliedFilters: AppliedFilter[] = [
      { id: "Category", items: [{ id: "Guides" }] },
    ]

    // Act
    const result = getFilteredItems(items, appliedFilters, "")

    // Assert
    expect(result).toEqual([])
  })

  it("combines search value with tag filters", () => {
    // Arrange
    const items: ProcessedCollectionCardProps[] = [
      {
        title: "Guide to Isomer",
        description: "",
        tags: [{ selected: ["Guides"], category: "Category" }],
      } as ProcessedCollectionCardProps,
      {
        title: "Guide to something else",
        description: "",
        tags: [{ selected: ["Articles"], category: "Category" }],
      } as ProcessedCollectionCardProps,
    ]
    const appliedFilters: AppliedFilter[] = [
      { id: "Category", items: [{ id: "Guides" }] },
    ]

    // Act
    const result = getFilteredItems(items, appliedFilters, "isomer")

    // Assert
    expect(result).toEqual([items[0]])
  })

  it("matches titles with fullwidth parentheses when searching with ASCII parentheses", () => {
    // Arrange
    const items: ProcessedCollectionCardProps[] = [
      {
        title:
          "CIRCULAR ON NEW FEEDBACK CHANNEL ON PUBLIC SECTOR FACILITIES MANAGEMENT （FM） PROJECTS",
        description: "",
      } as ProcessedCollectionCardProps,
    ]
    const search =
      "CIRCULAR ON NEW FEEDBACK CHANNEL ON PUBLIC SECTOR FACILITIES MANAGEMENT (FM)"

    // Act
    const result = getFilteredItems(items, [], search)

    // Assert
    expect(result).toEqual(items)
  })

  it("matches titles without a space before parentheses when the search includes one", () => {
    // Arrange
    const items: ProcessedCollectionCardProps[] = [
      {
        title:
          "Facilities Management(FM) Performance Appraisal Framework for FM Companies",
        description: "",
      } as ProcessedCollectionCardProps,
    ]

    // Act
    const result = getFilteredItems(items, [], "management (FM)")

    // Assert
    expect(result).toEqual(items)
  })

  it("matches a partial search from the middle of the title", () => {
    // Arrange
    const items: ProcessedCollectionCardProps[] = [
      {
        title:
          "Facilities Management (FM) Performance Appraisal Framework for FM Companies",
        description: "",
      } as ProcessedCollectionCardProps,
      {
        title: "Something else",
        description: "",
      } as ProcessedCollectionCardProps,
    ]

    // Act
    const result = getFilteredItems(items, [], "management (FM)")

    // Assert
    expect(result).toEqual([items[0]])
  })

  it("matches via description when title does not match and description is missing", () => {
    // Arrange
    const items: ProcessedCollectionCardProps[] = [
      {
        title: "Unrelated title",
        description: undefined,
      } as unknown as ProcessedCollectionCardProps,
      {
        title: "Another page",
        description: "Contains management (FM) guidance",
      } as ProcessedCollectionCardProps,
    ]

    // Act
    const result = getFilteredItems(items, [], "management (FM)")

    // Assert
    expect(result).toEqual([items[1]])
  })

  describe("date filters", () => {
    const EVENT_DATE_FILTER_ID = "event-date-filter-id"

    const dateTagCategories: CollectionPagePageProps["tagCategories"] = [
      {
        id: EVENT_DATE_FILTER_ID,
        label: "Event Date",
        type: "date",
        statusLabels: [
          { id: "ENDED", label: "Ended" },
          { id: "ONGOING", label: "Ongoing" },
          { id: "UPCOMING", label: "Upcoming" },
        ],
      },
    ]

    const toDateString = (date: Date) => date.toISOString().slice(0, 10)
    const daysFromNow = (days: number) => {
      const date = new Date()
      date.setDate(date.getDate() + days)
      return toDateString(date)
    }
    const ONGOING_RANGE = { date: daysFromNow(-5), endDate: daysFromNow(5) }
    const ENDED_RANGE = { date: daysFromNow(-20), endDate: daysFromNow(-10) }
    const today = daysFromNow(0)

    it("filters by bucket status (OR within the same date filter)", () => {
      // Arrange
      const items: ProcessedCollectionCardProps[] = [
        {
          title: "Ongoing event",
          description: "",
          dateTagged: [{ id: EVENT_DATE_FILTER_ID, ...ONGOING_RANGE }],
        } as ProcessedCollectionCardProps,
        {
          title: "Ended event",
          description: "",
          dateTagged: [{ id: EVENT_DATE_FILTER_ID, ...ENDED_RANGE }],
        } as ProcessedCollectionCardProps,
      ]
      const appliedFilters: AppliedFilter[] = [
        { id: EVENT_DATE_FILTER_ID, items: [{ id: "ONGOING" }] },
      ]

      // Act
      const result = getFilteredItems(
        items,
        appliedFilters,
        "",
        dateTagCategories,
        today,
      )

      // Assert
      expect(result).toEqual([items[0]])
    })

    it("filters by date-range overlap independently of bucket status", () => {
      // Arrange
      const items: ProcessedCollectionCardProps[] = [
        {
          title: "Overlaps the picked range",
          description: "",
          dateTagged: [
            {
              id: EVENT_DATE_FILTER_ID,
              date: daysFromNow(-2),
              endDate: daysFromNow(8),
            },
          ],
        } as ProcessedCollectionCardProps,
        {
          title: "Does not overlap the picked range",
          description: "",
          dateTagged: [
            {
              id: EVENT_DATE_FILTER_ID,
              date: daysFromNow(50),
              endDate: daysFromNow(51),
            },
          ],
        } as ProcessedCollectionCardProps,
      ]
      const appliedFilters: AppliedFilter[] = [
        {
          id: EVENT_DATE_FILTER_ID,
          items: [],
          dateRange: { start: daysFromNow(-5), end: daysFromNow(5) },
        },
      ]

      // Act
      const result = getFilteredItems(
        items,
        appliedFilters,
        "",
        dateTagCategories,
        today,
      )

      // Assert — the first item's range only partially overlaps the picked
      // window, but any overlap counts as a match.
      expect(result).toEqual([items[0]])
    })

    it("ANDs bucket status and date-range together within one date filter", () => {
      // Arrange
      const items: ProcessedCollectionCardProps[] = [
        {
          title: "Matches both",
          description: "",
          dateTagged: [{ id: EVENT_DATE_FILTER_ID, ...ONGOING_RANGE }],
        } as ProcessedCollectionCardProps,
        {
          title: "Matches range only, already ended",
          description: "",
          dateTagged: [{ id: EVENT_DATE_FILTER_ID, ...ENDED_RANGE }],
        } as ProcessedCollectionCardProps,
      ]
      const appliedFilters: AppliedFilter[] = [
        {
          id: EVENT_DATE_FILTER_ID,
          items: [{ id: "ONGOING" }],
          // Wide enough to overlap both fixtures' ranges, so only the
          // bucket-status check should be what excludes the second item.
          dateRange: { start: daysFromNow(-30), end: daysFromNow(30) },
        },
      ]

      // Act
      const result = getFilteredItems(
        items,
        appliedFilters,
        "",
        dateTagCategories,
        today,
      )

      // Assert
      expect(result).toEqual([items[0]])
    })

    it("excludes items with no value for an active date filter", () => {
      // Arrange
      const items: ProcessedCollectionCardProps[] = [
        {
          title: "Has a value",
          description: "",
          dateTagged: [{ id: EVENT_DATE_FILTER_ID, ...ONGOING_RANGE }],
        } as ProcessedCollectionCardProps,
        {
          title: "No value at all",
          description: "",
          dateTagged: undefined,
        } as ProcessedCollectionCardProps,
      ]
      const appliedFilters: AppliedFilter[] = [
        { id: EVENT_DATE_FILTER_ID, items: [{ id: "ONGOING" }] },
      ]

      // Act
      const result = getFilteredItems(
        items,
        appliedFilters,
        "",
        dateTagCategories,
        today,
      )

      // Assert
      expect(result).toEqual([items[0]])
    })

    it("routes date filters by tag category type even when no item has a value", () => {
      const items: ProcessedCollectionCardProps[] = [
        {
          title: "No date value",
          description: "",
          dateTagged: undefined,
        } as ProcessedCollectionCardProps,
      ]
      const appliedFilters: AppliedFilter[] = [
        { id: EVENT_DATE_FILTER_ID, items: [{ id: "ONGOING" }] },
      ]

      const result = getFilteredItems(
        items,
        appliedFilters,
        "",
        dateTagCategories,
        today,
      )

      expect(result).toEqual([])
    })
  })
})
