import type { ProcessedCollectionCardProps } from "~/interfaces"
import type { AppliedFilter } from "~/templates/next/types/Filter"
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
        tags: [{ id: "cat-1", selected: ["Guides"], category: "Category" }],
      } as ProcessedCollectionCardProps,
      {
        title: "B",
        description: "",
        tags: [{ id: "cat-1", selected: ["Articles"], category: "Category" }],
      } as ProcessedCollectionCardProps,
      {
        title: "C",
        description: "",
        tags: [{ id: "cat-1", selected: ["Tutorials"], category: "Category" }],
      } as ProcessedCollectionCardProps,
    ]
    const appliedFilters: AppliedFilter[] = [
      { id: "cat-1", items: [{ id: "Guides" }, { id: "Articles" }] },
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
          { id: "cat-1", selected: ["Guides"], category: "Category" },
          { id: "topic-1", selected: ["Health"], category: "Topic" },
        ],
      } as ProcessedCollectionCardProps,
      {
        title: "B",
        description: "",
        tags: [
          { id: "cat-1", selected: ["Guides"], category: "Category" },
          { id: "topic-1", selected: ["Finance"], category: "Topic" },
        ],
      } as ProcessedCollectionCardProps,
    ]
    const appliedFilters: AppliedFilter[] = [
      { id: "cat-1", items: [{ id: "Guides" }] },
      { id: "topic-1", items: [{ id: "Health" }] },
    ]

    // Act
    const result = getFilteredItems(items, appliedFilters, "")

    // Assert
    expect(result).toEqual([items[0]])
  })

  it("passes tag filters when item.tags is undefined (unrelated dimensions do not constrain)", () => {
    // Arrange
    const items: ProcessedCollectionCardProps[] = [
      {
        title: "A",
        description: "",
        tags: undefined,
      } as ProcessedCollectionCardProps,
    ]
    const appliedFilters: AppliedFilter[] = [
      { id: "cat-1", items: [{ id: "Guides" }] },
    ]

    // Act
    const result = getFilteredItems(items, appliedFilters, "")

    // Assert
    expect(result).toEqual([items[0]])
  })

  it("excludes items with a Category tag that does not match the applied filter", () => {
    // Arrange
    const items: ProcessedCollectionCardProps[] = [
      {
        title: "A",
        description: "",
        tags: [
          {
            id: "cat-1",
            selected: ["Others"],
            category: "Category",
          },
        ],
      } as ProcessedCollectionCardProps,
    ]
    const appliedFilters: AppliedFilter[] = [
      { id: "cat-1", items: [{ id: "Guides" }] },
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
        tags: [{ id: "cat-1", selected: ["Guides"], category: "Category" }],
      } as ProcessedCollectionCardProps,
      {
        title: "Guide to something else",
        description: "",
        tags: [{ id: "cat-1", selected: ["Articles"], category: "Category" }],
      } as ProcessedCollectionCardProps,
    ]
    const appliedFilters: AppliedFilter[] = [
      { id: "cat-1", items: [{ id: "Guides" }] },
    ]

    // Act
    const result = getFilteredItems(items, appliedFilters, "isomer")

    // Assert
    expect(result).toEqual([items[0]])
  })
})
