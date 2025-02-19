import { describe, expect, it } from "vitest"

import type { ProcessedCollectionCardProps } from "~/interfaces"
import { getTagFilters } from "../getTagFilters"

describe("getTagFilters", () => {
  it("returns filters grouped by tag category", () => {
    // Arrange
    const items: ProcessedCollectionCardProps[] = [
      {
        title: "Item 1",
        tags: [
          { selected: ["Brain", "Heart"], category: "Body parts" },
          { selected: ["Acute"], category: "Condition" },
        ],
        category: "category1",
      } as ProcessedCollectionCardProps,
      {
        title: "Item 2",
        tags: [
          { selected: ["Brain"], category: "Body parts" },
          { selected: ["Chronic"], category: "Condition" },
        ],
        category: "category2",
      } as ProcessedCollectionCardProps,
    ]

    // Act
    const result = getTagFilters(items)

    // Assert
    expect(result).toEqual([
      {
        id: "Body parts",
        label: "Body parts",
        items: [
          { id: "Brain", label: "Brain", count: 2 },
          { id: "Heart", label: "Heart", count: 1 },
        ],
      },
      {
        id: "Condition",
        label: "Condition",
        items: [
          { id: "Acute", label: "Acute", count: 1 },
          { id: "Chronic", label: "Chronic", count: 1 },
        ],
      },
    ])
  })

  it("returns empty array when no items have tags", () => {
    // Arrange
    const items: ProcessedCollectionCardProps[] = [
      {
        title: "Item 1",
        description: "Description 1",
        category: "category1",
      } as ProcessedCollectionCardProps,
    ]

    // Act
    const result = getTagFilters(items)

    // Assert
    expect(result).toEqual([])
  })

  it("returns empty array for empty input", () => {
    // Arrange
    const items: ProcessedCollectionCardProps[] = []

    // Act
    const result = getTagFilters(items)

    // Assert
    expect(result).toEqual([])
  })
})
