import { describe, expect, it } from "vitest"

import type { ProcessedCollectionCardProps } from "~/interfaces"
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
})
