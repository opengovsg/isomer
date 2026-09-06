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
      testCollectionItem({ description: "", title: "A" }),
      testCollectionItem({ description: "", title: "B" }),
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
        description: "",
        title: "Guide to Isomer",
      }),
      testCollectionItem({
        description: "",
        title: "Something else",
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
        description: "Contains keyword here",
        title: "A",
      }),
      testCollectionItem({ description: "No match", title: "B" }),
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
        date: new Date("2023-05-01"),
        description: "",
        title: "A",
      }),
      testCollectionItem({
        date: new Date("2022-05-01"),
        description: "",
        title: "B",
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
        date: undefined,
        description: "",
        title: "A",
      }),
      testCollectionItem({
        date: new Date("2022-05-01"),
        description: "",
        title: "B",
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
        description: "",
        tags: [{ category: "Category", selected: ["Guides"] }],
        title: "A",
      }),
      testCollectionItem({
        description: "",
        tags: [{ category: "Category", selected: ["Articles"] }],
        title: "B",
      }),
      testCollectionItem({
        description: "",
        tags: [{ category: "Category", selected: ["Tutorials"] }],
        title: "C",
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
        description: "",
        tags: [
          { category: "Category", selected: ["Guides"] },
          { category: "Topic", selected: ["Health"] },
        ],
        title: "A",
      }),
      testCollectionItem({
        description: "",
        tags: [
          { category: "Category", selected: ["Guides"] },
          { category: "Topic", selected: ["Finance"] },
        ],
        title: "B",
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
        description: "",
        tags: undefined,
        title: "A",
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
        description: "",
        tags: [{ category: "Category", selected: ["Guides"] }],
        title: "Guide to Isomer",
      }),
      testCollectionItem({
        description: "",
        tags: [{ category: "Category", selected: ["Articles"] }],
        title: "Guide to something else",
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
        description: "",
        title:
          "CIRCULAR ON NEW FEEDBACK CHANNEL ON PUBLIC SECTOR FACILITIES MANAGEMENT （FM） PROJECTS",
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
        description: "",
        title:
          "Facilities Management(FM) Performance Appraisal Framework for FM Companies",
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
        description: "",
        title:
          "Facilities Management (FM) Performance Appraisal Framework for FM Companies",
      }),
      testCollectionItem({
        description: "",
        title: "Something else",
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
        description: undefined,
        title: "Unrelated title",
      }),
      testCollectionItem({
        description: "Contains management (FM) guidance",
        title: "Another page",
      }),
    ]

    // Act
    const result = getFilteredItems(items, [], "management (FM)")

    // Assert
    expect(result).toEqual([items[1]])
  })
})
