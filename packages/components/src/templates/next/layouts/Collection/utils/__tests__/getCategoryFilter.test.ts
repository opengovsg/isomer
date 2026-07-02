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
    expect(result.items.map((i) => i.label)).toEqual([
      "Apple",
      "Mango",
      "Zebra",
    ])
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

  it("orders correctly when categoryOptions labels are lowercase", () => {
    // Arrange — admin saved labels in lowercase; schema only enforces non-empty, not case
    const items: ProcessedCollectionCardProps[] = [
      { category: "news" } as ProcessedCollectionCardProps,
      { category: "policy" } as ProcessedCollectionCardProps,
      { category: "research" } as ProcessedCollectionCardProps,
    ]

    const categoryOptions: CollectionPageCategoryOption[] = [
      { id: "cat-uuid-1", label: "research" },
      { id: "cat-uuid-2", label: "policy" },
      { id: "cat-uuid-3", label: "news" },
    ]

    // Act
    const result = getCategoryFilter(items, categoryOptions)

    // Assert — order must follow categoryOptions, not fall back to alphabetical
    expect(result.items.map((i) => i.id)).toEqual([
      "research",
      "policy",
      "news",
    ])
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

  it("sorts multiple unknown categories alphabetically when appended after known categories", () => {
    // Arrange
    const items: ProcessedCollectionCardProps[] = [
      { category: "Zebra" } as ProcessedCollectionCardProps, // unknown
      { category: "News" } as ProcessedCollectionCardProps, // known
      { category: "Apple" } as ProcessedCollectionCardProps, // unknown
      { category: "Policy" } as ProcessedCollectionCardProps, // known
    ]

    const categoryOptions: CollectionPageCategoryOption[] = [
      { id: "cat-uuid-1", label: "Policy" },
      { id: "cat-uuid-2", label: "News" },
      // "Zebra" and "Apple" are intentionally absent
    ]

    // Act
    const result = getCategoryFilter(items, categoryOptions)

    // Assert — known items first in editor order, unknown items alphabetically after
    expect(result.items.map((i) => i.label)).toEqual([
      "Policy",
      "News",
      "Apple",
      "Zebra",
    ])
  })

  it("uses a custom categoryLabel when provided", () => {
    // Arrange
    const items: ProcessedCollectionCardProps[] = [
      { category: "News" } as ProcessedCollectionCardProps,
    ]

    // Act
    const result = getCategoryFilter(items, undefined, "Topic")

    // Assert
    expect(result.label).toBe("Topic")
  })

  it.each([
    ["omitted", undefined],
    ["empty string", ""],
    ["whitespace", "   "],
  ] as const)("falls back to Category when categoryLabel is %s", (_, label) => {
    // Arrange
    const items: ProcessedCollectionCardProps[] = [
      { category: "News" } as ProcessedCollectionCardProps,
    ]

    // Act
    const result = getCategoryFilter(items, undefined, label)

    // Assert
    expect(result.label).toBe("Category")
  })
})
