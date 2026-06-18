import type { ProcessedCollectionCardProps } from "~/interfaces"
import type { CollectionPageCategoryOption } from "~/types/page"
import { describe, expect, it } from "vitest"

import { getCategoryFilter } from "../getCategoryFilter"

describe("getCategoryFilter", () => {
  it("should return empty filter items when no items provided", () => {
    // Arrange
    const items: ProcessedCollectionCardProps[] = []

    // Act
    const result = getCategoryFilter(items)

    // Assert
    expect(result).toEqual({
      id: "category",
      label: "Category",
      items: [],
    })
  })

  it("should count and format categories correctly", () => {
    // Arrange
    const items: ProcessedCollectionCardProps[] = [
      {
        category: "guides",
      } as ProcessedCollectionCardProps,
      {
        category: "guides",
      } as ProcessedCollectionCardProps,
      {
        category: "articles",
      } as ProcessedCollectionCardProps,
      {
        category: "tutorials",
      } as ProcessedCollectionCardProps,
      {
        category: "tutorials",
      } as ProcessedCollectionCardProps,
    ]

    // Act
    const result = getCategoryFilter(items)

    // Assert
    expect(result).toEqual({
      id: "category",
      label: "Category",
      items: [
        { id: "articles", label: "Articles", count: 1 },
        { id: "guides", label: "Guides", count: 2 },
        { id: "tutorials", label: "Tutorials", count: 2 },
      ],
    })
  })

  it("sorts alphabetically when categoryOptions is not provided", () => {
    // Arrange
    const items: ProcessedCollectionCardProps[] = [
      { category: "Zebra" } as ProcessedCollectionCardProps,
      { category: "Apple" } as ProcessedCollectionCardProps,
      { category: "Mango" } as ProcessedCollectionCardProps,
      { category: "Apple" } as ProcessedCollectionCardProps,
    ]

    // Act
    const result = getCategoryFilter(items)

    // Assert
    expect(result.items.map((i) => i.label)).toEqual(["Apple", "Mango", "Zebra"])
  })

  it("orders filter items according to categoryOptions order, not alphabetically", () => {
    // Arrange
    const items: ProcessedCollectionCardProps[] = [
      { category: "News" } as ProcessedCollectionCardProps,
      { category: "Policy" } as ProcessedCollectionCardProps,
      { category: "Research" } as ProcessedCollectionCardProps,
      { category: "News" } as ProcessedCollectionCardProps,
    ]

    const categoryOptions: CollectionPageCategoryOption[] = [
      { id: "cat-uuid-1", label: "Research" },
      { id: "cat-uuid-2", label: "Policy" },
      { id: "cat-uuid-3", label: "News" },
    ]

    // Act
    const result = getCategoryFilter(items, categoryOptions)

    // Assert
    expect(result).toEqual({
      id: "category",
      label: "Category",
      items: [
        { id: "research", label: "Research", count: 1 },
        { id: "policy", label: "Policy", count: 1 },
        { id: "news", label: "News", count: 2 },
      ],
    })
  })

  it("excludes categoryOptions entries that have no matching items", () => {
    // Arrange
    const items: ProcessedCollectionCardProps[] = [
      { category: "News" } as ProcessedCollectionCardProps,
      { category: "Policy" } as ProcessedCollectionCardProps,
    ]

    const categoryOptions: CollectionPageCategoryOption[] = [
      { id: "cat-uuid-1", label: "Research" }, // No items with this category
      { id: "cat-uuid-2", label: "Policy" },
      { id: "cat-uuid-3", label: "News" },
    ]

    // Act
    const result = getCategoryFilter(items, categoryOptions)

    // Assert
    expect(result.items.map((i) => i.label)).toEqual(["Policy", "News"])
    expect(result.items).not.toContainEqual(
      expect.objectContaining({ label: "Research" }),
    )
  })

  it("places categories not listed in categoryOptions at the end", () => {
    // Arrange
    const items: ProcessedCollectionCardProps[] = [
      { category: "Others" } as ProcessedCollectionCardProps, // Not in categoryOptions
      { category: "News" } as ProcessedCollectionCardProps,
      { category: "Policy" } as ProcessedCollectionCardProps,
    ]

    const categoryOptions: CollectionPageCategoryOption[] = [
      { id: "cat-uuid-2", label: "Policy" },
      { id: "cat-uuid-3", label: "News" },
      // "Others" is intentionally absent
    ]

    // Act
    const result = getCategoryFilter(items, categoryOptions)

    // Assert
    expect(result.items.map((i) => i.label)).toEqual([
      "Policy",
      "News",
      "Others",
    ])
  })
})
