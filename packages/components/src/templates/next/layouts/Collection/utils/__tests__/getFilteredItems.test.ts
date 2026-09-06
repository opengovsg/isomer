import type { ProcessedCollectionCardProps } from "~/interfaces"
import type { AppliedFilter } from "~/templates/next/types/Filter"
import { describe, expect, it } from "vitest"

import { NO_SPECIFIED_YEAR_FILTER_ID } from "../constants"
import { getFilteredItems } from "../getFilteredItems"
import { testCollectionItem } from "./testHelpers"

describe("getFilteredItems", () => {
  it("returns all items when there is no search value and no applied filters", () => {
    // Arrange
    const items: ProcessedCollectionCardProps[] = [
      testCollectionItem({ title: "A", description: "" }),
      testCollectionItem({ title: "B", description: "" }),
    ]

    // Act
    const result = getFilteredItems(items, [], "")

    // Assert
    expect(result).toEqual(items)
  })

  it("filters by search value matching the title, case-insensitively", () => {
    // Arrange
    const items: ProcessedCollectionCardProps[] = [
      testCollectionItem({
        title: "Guide to Isomer",
        description: "",
      }),
      testCollectionItem({
        title: "Something else",
        description: "",
      }),
    ]

    // Act
    const result = getFilteredItems(items, [], "isomer")

    // Assert
    expect(result).toEqual([items[0]])
  })

  it("filters by search value matching the description", () => {
    // Arrange
    const items: ProcessedCollectionCardProps[] = [
      testCollectionItem({
        title: "A",
        description: "Contains keyword here",
      }),
      testCollectionItem({ title: "B", description: "No match" }),
    ]

    // Act
    const result = getFilteredItems(items, [], "keyword")

    // Assert
    expect(result).toEqual([items[0]])
  })

  it("filters by year matching the item's date", () => {
    // Arrange
    const items: ProcessedCollectionCardProps[] = [
      testCollectionItem({
        title: "A",
        description: "",
        date: new Date("2023-05-01"),
      }),
      testCollectionItem({
        title: "B",
        description: "",
        date: new Date("2022-05-01"),
      }),
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
      testCollectionItem({
        title: "A",
        description: "",
        date: undefined,
      }),
      testCollectionItem({
        title: "B",
        description: "",
        date: new Date("2022-05-01"),
      }),
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
      testCollectionItem({
        title: "A",
        description: "",
        tags: [{ selected: ["Guides"], category: "Category" }],
      }),
      testCollectionItem({
        title: "B",
        description: "",
        tags: [{ selected: ["Articles"], category: "Category" }],
      }),
      testCollectionItem({
        title: "C",
        description: "",
        tags: [{ selected: ["Tutorials"], category: "Category" }],
      }),
    ]
    const appliedFilters: AppliedFilter[] = [
      {
        id: "Category",
        items: [{ id: "Guides" }, { id: "Articles" }],
      },
    ]

    // Act
    const result = getFilteredItems(items, appliedFilters, "")

    // Assert
    expect(result).toEqual([items[0], items[1]])
  })

  it("applies AND semantics across different filter groups, including a migrated Category group", () => {
    // Arrange
    const items: ProcessedCollectionCardProps[] = [
      testCollectionItem({
        title: "A",
        description: "",
        tags: [
          { selected: ["Guides"], category: "Category" },
          { selected: ["Health"], category: "Topic" },
        ],
      }),
      testCollectionItem({
        title: "B",
        description: "",
        tags: [
          { selected: ["Guides"], category: "Category" },
          { selected: ["Finance"], category: "Topic" },
        ],
      }),
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
      testCollectionItem({
        title: "A",
        description: "",
        tags: undefined,
      }),
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
      testCollectionItem({
        title: "Guide to Isomer",
        description: "",
        tags: [{ selected: ["Guides"], category: "Category" }],
      }),
      testCollectionItem({
        title: "Guide to something else",
        description: "",
        tags: [{ selected: ["Articles"], category: "Category" }],
      }),
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
      testCollectionItem({
        title:
          "CIRCULAR ON NEW FEEDBACK CHANNEL ON PUBLIC SECTOR FACILITIES MANAGEMENT （FM） PROJECTS",
        description: "",
      }),
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
      testCollectionItem({
        title:
          "Facilities Management(FM) Performance Appraisal Framework for FM Companies",
        description: "",
      }),
    ]

    // Act
    const result = getFilteredItems(items, [], "management (FM)")

    // Assert
    expect(result).toEqual(items)
  })

  it("matches a partial search from the middle of the title", () => {
    // Arrange
    const items: ProcessedCollectionCardProps[] = [
      testCollectionItem({
        title:
          "Facilities Management (FM) Performance Appraisal Framework for FM Companies",
        description: "",
      }),
      testCollectionItem({
        title: "Something else",
        description: "",
      }),
    ]

    // Act
    const result = getFilteredItems(items, [], "management (FM)")

    // Assert
    expect(result).toEqual([items[0]])
  })

  it("matches via description when title does not match and description is missing", () => {
    // Arrange
    const items: ProcessedCollectionCardProps[] = [
      testCollectionItem({
        title: "Unrelated title",
        description: undefined,
      }),
      testCollectionItem({
        title: "Another page",
        description: "Contains management (FM) guidance",
      }),
    ]

    // Act
    const result = getFilteredItems(items, [], "management (FM)")

    // Assert
    expect(result).toEqual([items[1]])
  })
})
