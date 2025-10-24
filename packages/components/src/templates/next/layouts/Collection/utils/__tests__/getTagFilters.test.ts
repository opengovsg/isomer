import { describe, expect, it } from "vitest"

import type { ProcessedCollectionCardProps } from "~/interfaces"
import type { CollectionPageSchemaType } from "~/types"
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

  it("orders categories according to tagCategories label order; unlisted last", () => {
    // Arrange
    const items: ProcessedCollectionCardProps[] = [
      {
        title: "Item 1",
        tags: [
          { selected: ["Brain"], category: "Body parts" },
          { selected: ["Acute"], category: "Condition" },
        ],
        category: "category1",
      } as ProcessedCollectionCardProps,
    ]

    const tagCategories: CollectionPageSchemaType["page"]["tagCategories"] = [
      {
        label: "Condition",
        id: "c-1",
        options: [{ label: "Acute", id: "o-1" }],
      },
      {
        label: "Body parts",
        id: "b-1",
        options: [{ label: "Brain", id: "o-2" }],
      },
    ]

    // Act
    const result = getTagFilters(items, tagCategories)

    // Assert
    expect(result).toEqual([
      {
        id: "Condition",
        label: "Condition",
        items: [{ id: "Acute", label: "Acute", count: 1 }],
      },
      {
        id: "Body parts",
        label: "Body parts",
        items: [{ id: "Brain", label: "Brain", count: 1 }],
      },
    ])
  })

  it("orders items within a category by options order; unlisted come first", () => {
    // Arrange
    const items: ProcessedCollectionCardProps[] = [
      {
        title: "Item 1",
        tags: [
          { selected: ["Brain", "Arm"], category: "Body parts" },
          { selected: ["Acute"], category: "Condition" },
        ],
        category: "category1",
      } as ProcessedCollectionCardProps,
      {
        title: "Item 2",
        tags: [
          { selected: ["Heart"], category: "Body parts" },
          { selected: ["Chronic"], category: "Condition" },
        ],
        category: "category2",
      } as ProcessedCollectionCardProps,
    ]

    const tagCategories: CollectionPageSchemaType["page"]["tagCategories"] = [
      {
        label: "Body parts",
        id: "b-1",
        options: [
          { label: "Heart", id: "bp-heart" },
          { label: "Brain", id: "bp-brain" },
          { label: "Leg", id: "bp-leg" },
        ],
      },
      {
        label: "Condition",
        id: "c-1",
        options: [
          { label: "Chronic", id: "c-chronic" },
          { label: "Acute", id: "c-acute" },
        ],
      },
    ]

    // Act
    const result = getTagFilters(items, tagCategories)

    // Assert
    expect(result).toEqual([
      {
        id: "Body parts",
        label: "Body parts",
        items: [
          { id: "Arm", label: "Arm", count: 1 }, // Unlisted; comes first
          { id: "Heart", label: "Heart", count: 1 },
          { id: "Brain", label: "Brain", count: 1 },
        ],
      },
      {
        id: "Condition",
        label: "Condition",
        items: [
          { id: "Chronic", label: "Chronic", count: 1 },
          { id: "Acute", label: "Acute", count: 1 },
        ],
      },
    ])
  })

  it("does not enforce item ordering when tagCategories is omitted (insertion order)", () => {
    // Arrange
    const items: ProcessedCollectionCardProps[] = [
      {
        title: "Item 1",
        tags: [{ selected: ["Banana"], category: "Fruits" }],
        category: "c1",
      } as ProcessedCollectionCardProps,
      {
        title: "Item 2",
        tags: [{ selected: ["Apple"], category: "Fruits" }],
        category: "c2",
      } as ProcessedCollectionCardProps,
      {
        title: "Item 3",
        tags: [{ selected: ["Banana"], category: "Fruits" }],
        category: "c3",
      } as ProcessedCollectionCardProps,
    ]

    // Act
    const result = getTagFilters(items)

    // Assert
    expect(result).toEqual([
      {
        id: "Fruits",
        label: "Fruits",
        items: [
          { id: "Banana", label: "Banana", count: 2 },
          { id: "Apple", label: "Apple", count: 1 },
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
