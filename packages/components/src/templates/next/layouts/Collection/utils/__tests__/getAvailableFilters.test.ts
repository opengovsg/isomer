import type { ProcessedCollectionCardProps } from "~/interfaces"
import type { CollectionPageSchemaType } from "~/types"
import { describe, expect, it } from "vitest"
import { TAG_CATEGORY_DISPLAY_OPTIONS } from "~/types/constants"

import { getAvailableFilters } from "../getAvailableFilters"

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
      {
        title: "Item 1",
        tags: [{ id: "cat-1", selected: ["Guides"], category: "Category" }],
        date: new Date("2023-01-01"),
      } as ProcessedCollectionCardProps,
    ]
    const tagCategories: CollectionPageSchemaType["page"]["tagCategories"] = [
      {
        label: "Category",
        id: "cat-1",
        isRequired: true,
        display: TAG_CATEGORY_DISPLAY_OPTIONS.Pills,
        options: [{ label: "Guides", id: "opt-1" }],
      },
    ]

    // Act
    const result = getAvailableFilters(items, tagCategories)

    // Assert — exactly one "Category" filter, keyed by stable id
    const categoryFilters = result.filter((filter) => filter.id === "cat-1")
    expect(categoryFilters).toHaveLength(1)
    expect(categoryFilters[0]).toEqual({
      id: "cat-1",
      label: "Category",
      display: TAG_CATEGORY_DISPLAY_OPTIONS.Pills,
      items: [{ id: "Guides", label: "Guides", count: 1 }],
    })
  })

  it("orders tag filters (including a migrated Category group) before the year filter", () => {
    // Arrange
    const items: ProcessedCollectionCardProps[] = [
      {
        title: "Item 1",
        tags: [{ id: "cat-1", selected: ["Guides"], category: "Category" }],
        date: new Date("2023-01-01"),
      } as ProcessedCollectionCardProps,
    ]
    const tagCategories: CollectionPageSchemaType["page"]["tagCategories"] = [
      {
        label: "Category",
        id: "cat-1",
        display: TAG_CATEGORY_DISPLAY_OPTIONS.Plaintext,
        options: [{ label: "Guides", id: "cat-opt-1" }],
      },
    ]

    // Act
    const result = getAvailableFilters(items, tagCategories)

    // Assert
    expect(result.map((filter) => filter.id)).toEqual(["cat-1", "year"])
  })

  it("omits filters that have no items", () => {
    // Arrange
    const items: ProcessedCollectionCardProps[] = [
      {
        title: "Item 1",
        tags: [],
        date: undefined,
      } as unknown as ProcessedCollectionCardProps,
    ]

    // Act
    const result = getAvailableFilters(items)

    // Assert
    expect(result).toEqual([])
  })
})
