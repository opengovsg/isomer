import type { ProcessedCollectionCardProps } from "~/interfaces"
import type { CollectionPageSchemaType } from "~/types"
import { describe, expect, it } from "vitest"
import { TAG_CATEGORY_DISPLAY_OPTIONS } from "~/types/constants"

import { getAvailableFilters } from "../getAvailableFilters"
import { testCollectionItem } from "./testHelpers"

describe("getAvailableFilters", () => {
  it("returns no filters when there are no items", () => {
    // Arrange
    const items: ProcessedCollectionCardProps[] = []

    // Act
    const result = getAvailableFilters(items)

    // Assert
    expect(result).toEqual([])
  })

  it("renders a migrated 'Category' tagCategories group as an ordinary tag filter, not duplicated", () => {
    // Arrange
    const items: ProcessedCollectionCardProps[] = [
      testCollectionItem({
        date: new Date("2023-01-01"),
        tags: [{ category: "Category", selected: ["Guides"] }],
        title: "Item 1",
      }),
    ]
    const tagCategories: CollectionPageSchemaType["page"]["tagCategories"] = [
      {
        display: TAG_CATEGORY_DISPLAY_OPTIONS.Pills,
        id: "cat-1",
        isRequired: true,
        label: "Category",
        options: [{ id: "opt-1", label: "Guides" }],
      },
    ]

    // Act
    const result = getAvailableFilters(items, tagCategories)

    // Assert — exactly one "Category" filter, sourced from tagCategories/tags
    const categoryFilters = result.filter((filter) => filter.id === "Category")
    expect(categoryFilters).toHaveLength(1)
    expect(categoryFilters[0]).toEqual({
      display: TAG_CATEGORY_DISPLAY_OPTIONS.Pills,
      id: "Category",
      items: [{ count: 1, id: "Guides", label: "Guides" }],
      label: "Category",
    })
  })

  it("orders tag filters (including a migrated Category group) before the year filter", () => {
    // Arrange
    const items: ProcessedCollectionCardProps[] = [
      testCollectionItem({
        date: new Date("2023-01-01"),
        tags: [{ category: "Category", selected: ["Guides"] }],
        title: "Item 1",
      }),
    ]

    // Act
    const result = getAvailableFilters(items)

    // Assert
    expect(result.map((filter) => filter.id)).toEqual(["Category", "year"])
  })

  it("omits filters that have no items", () => {
    // Arrange
    const items: ProcessedCollectionCardProps[] = [
      testCollectionItem({
        date: undefined,
        tags: [],
        title: "Item 1",
      }),
    ]

    // Act
    const result = getAvailableFilters(items)

    // Assert
    expect(result).toEqual([])
  })
})
