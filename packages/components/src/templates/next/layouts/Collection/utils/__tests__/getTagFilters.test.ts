import type { ProcessedCollectionCardProps } from "~/interfaces"
import type { CollectionPageSchemaType } from "~/types"
import { describe, expect, it } from "vitest"
import { TAG_CATEGORY_DISPLAY_OPTIONS } from "~/types/constants"

import { getTagFilters } from "../getTagFilters"
import { testCollectionItem } from "./testHelpers"

describe("getTagFilters", () => {
  it("returns filters grouped by tag category", () => {
    // Arrange
    const items: ProcessedCollectionCardProps[] = [
      testCollectionItem({
        tags: [
          { category: "Body parts", selected: ["Brain", "Heart"] },
          { category: "Condition", selected: ["Acute"] },
        ],
        title: "Item 1",
      }),
      testCollectionItem({
        tags: [
          { category: "Body parts", selected: ["Brain"] },
          { category: "Condition", selected: ["Chronic"] },
        ],
        title: "Item 2",
      }),
    ]

    // Act
    const result = getTagFilters(items)

    // Assert
    expect(result).toEqual([
      {
        display: "pills",
        id: "Body parts",
        items: [
          { count: 2, id: "Brain", label: "Brain" },
          { count: 1, id: "Heart", label: "Heart" },
        ],
        label: "Body parts",
      },
      {
        display: "pills",
        id: "Condition",
        items: [
          { count: 1, id: "Acute", label: "Acute" },
          { count: 1, id: "Chronic", label: "Chronic" },
        ],
        label: "Condition",
      },
    ])
  })

  it("orders categories according to tagCategories label order; unlisted last", () => {
    // Arrange
    const items: ProcessedCollectionCardProps[] = [
      testCollectionItem({
        tags: [
          { category: "Body parts", selected: ["Brain"] },
          { category: "Condition", selected: ["Acute"] },
        ],
        title: "Item 1",
      }),
    ]

    const tagCategories: CollectionPageSchemaType["page"]["tagCategories"] = [
      {
        display: TAG_CATEGORY_DISPLAY_OPTIONS.Pills,
        id: "c-1",
        label: "Condition",
        options: [{ id: "o-1", label: "Acute" }],
      },
      {
        display: TAG_CATEGORY_DISPLAY_OPTIONS.Pills,
        id: "b-1",
        label: "Body parts",
        options: [{ id: "o-2", label: "Brain" }],
      },
    ]

    // Act
    const result = getTagFilters(items, tagCategories)

    // Assert
    expect(result).toEqual([
      {
        display: "pills",
        id: "Condition",
        items: [{ count: 1, id: "Acute", label: "Acute" }],
        label: "Condition",
      },
      {
        display: "pills",
        id: "Body parts",
        items: [{ count: 1, id: "Brain", label: "Brain" }],
        label: "Body parts",
      },
    ])
  })

  it("orders items within a category by options order; unlisted come first", () => {
    // Arrange
    const items: ProcessedCollectionCardProps[] = [
      testCollectionItem({
        tags: [
          { category: "Body parts", selected: ["Brain", "Arm"] },
          { category: "Condition", selected: ["Acute"] },
        ],
        title: "Item 1",
      }),
      testCollectionItem({
        tags: [
          { category: "Body parts", selected: ["Heart"] },
          { category: "Condition", selected: ["Chronic"] },
        ],
        title: "Item 2",
      }),
    ]

    const tagCategories: CollectionPageSchemaType["page"]["tagCategories"] = [
      {
        display: TAG_CATEGORY_DISPLAY_OPTIONS.Pills,
        id: "b-1",
        label: "Body parts",
        options: [
          { id: "bp-heart", label: "Heart" },
          { id: "bp-brain", label: "Brain" },
          { id: "bp-leg", label: "Leg" },
        ],
      },
      {
        display: TAG_CATEGORY_DISPLAY_OPTIONS.Pills,
        id: "c-1",
        label: "Condition",
        options: [
          { id: "c-chronic", label: "Chronic" },
          { id: "c-acute", label: "Acute" },
        ],
      },
    ]

    // Act
    const result = getTagFilters(items, tagCategories)

    // Assert
    expect(result).toEqual([
      {
        display: "pills",
        id: "Body parts",
        items: [
          { count: 1, id: "Arm", label: "Arm" }, // Unlisted; comes first
          { count: 1, id: "Heart", label: "Heart" },
          { count: 1, id: "Brain", label: "Brain" },
        ],
        label: "Body parts",
      },
      {
        display: "pills",
        id: "Condition",
        items: [
          { count: 1, id: "Chronic", label: "Chronic" },
          { count: 1, id: "Acute", label: "Acute" },
        ],
        label: "Condition",
      },
    ])
  })

  it("does not enforce item ordering when tagCategories is omitted (insertion order)", () => {
    // Arrange
    const items: ProcessedCollectionCardProps[] = [
      testCollectionItem({
        tags: [{ category: "Fruits", selected: ["Banana"] }],
        title: "Item 1",
      }),
      testCollectionItem({
        tags: [{ category: "Fruits", selected: ["Apple"] }],
        title: "Item 2",
      }),
      testCollectionItem({
        tags: [{ category: "Fruits", selected: ["Banana"] }],
        title: "Item 3",
      }),
    ]

    // Act
    const result = getTagFilters(items)

    // Assert
    expect(result).toEqual([
      {
        display: "pills",
        id: "Fruits",
        items: [
          { count: 2, id: "Banana", label: "Banana" },
          { count: 1, id: "Apple", label: "Apple" },
        ],
        label: "Fruits",
      },
    ])
  })

  it("returns empty array when no items have tags", () => {
    // Arrange
    const items: ProcessedCollectionCardProps[] = [
      testCollectionItem({
        description: "Description 1",
        title: "Item 1",
      }),
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

  it("handles mixed scenarios: some categories in tagCategories, some not", () => {
    // Arrange
    const items: ProcessedCollectionCardProps[] = [
      testCollectionItem({
        tags: [
          { category: "Body parts", selected: ["Brain"] },
          { category: "Condition", selected: ["Acute"] },
          { category: "Color", selected: ["Red"] },
        ],
        title: "Item 1",
      }),
      testCollectionItem({
        tags: [
          { category: "Body parts", selected: ["Heart"] },
          { category: "Color", selected: ["Blue"] },
        ],
        title: "Item 2",
      }),
    ]

    const tagCategories: CollectionPageSchemaType["page"]["tagCategories"] = [
      {
        display: TAG_CATEGORY_DISPLAY_OPTIONS.Pills,
        id: "c-1",
        label: "Condition",
        options: [
          { id: "c-acute", label: "Acute" },
          { id: "c-chronic", label: "Chronic" },
        ],
      },
      {
        display: TAG_CATEGORY_DISPLAY_OPTIONS.Pills,
        id: "b-1",
        label: "Body parts",
        options: [
          { id: "bp-heart", label: "Heart" },
          { id: "bp-brain", label: "Brain" },
        ],
      },
      // Note: "Color" category is NOT in tagCategories
    ]

    // Act
    const result = getTagFilters(items, tagCategories)

    // Assert
    expect(result).toEqual([
      {
        display: "pills",
        id: "Condition",
        items: [{ count: 1, id: "Acute", label: "Acute" }],
        label: "Condition",
      },
      {
        display: "pills",
        id: "Body parts",
        items: [
          { count: 1, id: "Heart", label: "Heart" },
          { count: 1, id: "Brain", label: "Brain" },
        ],
        label: "Body parts",
      },
      {
        display: "pills",
        id: "Color",
        items: [
          { count: 1, id: "Red", label: "Red" },
          { count: 1, id: "Blue", label: "Blue" },
        ],
        label: "Color",
      },
    ])
  })

  it("handles empty options arrays in tagCategories", () => {
    // Arrange
    const items: ProcessedCollectionCardProps[] = [
      testCollectionItem({
        tags: [
          { category: "Body parts", selected: ["Brain", "Heart"] },
          { category: "Condition", selected: ["Acute"] },
        ],
        title: "Item 1",
      }),
    ]

    const tagCategories: CollectionPageSchemaType["page"]["tagCategories"] = [
      {
        display: TAG_CATEGORY_DISPLAY_OPTIONS.Pills,
        id: "c-1",
        label: "Condition",
        options: [], // Empty options array
      },
      {
        display: TAG_CATEGORY_DISPLAY_OPTIONS.Pills,
        id: "b-1",
        label: "Body parts",
        options: [
          { id: "bp-heart", label: "Heart" },
          { id: "bp-brain", label: "Brain" },
        ],
      },
    ]

    // Act
    const result = getTagFilters(items, tagCategories)

    // Assert
    expect(result).toEqual([
      {
        display: "pills",
        id: "Condition",
        items: [{ count: 1, id: "Acute", label: "Acute" }], // Unlisted item appears first
        label: "Condition",
      },
      {
        display: "pills",
        id: "Body parts",
        items: [
          { count: 1, id: "Heart", label: "Heart" },
          { count: 1, id: "Brain", label: "Brain" },
        ],
        label: "Body parts",
      },
    ])
  })

  it("handles duplicate tags across multiple items correctly", () => {
    // Arrange
    const items: ProcessedCollectionCardProps[] = [
      testCollectionItem({
        tags: [
          { category: "Body parts", selected: ["Brain", "Heart"] },
          { category: "Condition", selected: ["Acute"] },
        ],
        title: "Item 1",
      }),
      testCollectionItem({
        tags: [
          { category: "Body parts", selected: ["Brain"] },
          { category: "Condition", selected: ["Acute", "Chronic"] },
        ],
        title: "Item 2",
      }),
      testCollectionItem({
        tags: [
          { category: "Body parts", selected: ["Heart"] },
          { category: "Condition", selected: ["Acute"] },
        ],
        title: "Item 3",
      }),
    ]

    // Act
    const result = getTagFilters(items)

    // Assert
    expect(result).toEqual([
      {
        display: "pills",
        id: "Body parts",
        items: [
          { count: 2, id: "Brain", label: "Brain" }, // Appears in 2 items
          { count: 2, id: "Heart", label: "Heart" }, // Appears in 2 items
        ],
        label: "Body parts",
      },
      {
        display: "pills",
        id: "Condition",
        items: [
          { count: 3, id: "Acute", label: "Acute" }, // Appears in 3 items
          { count: 1, id: "Chronic", label: "Chronic" }, // Appears in 1 item
        ],
        label: "Condition",
      },
    ])
  })

  it("handles items with no tags gracefully", () => {
    // Arrange
    const items: ProcessedCollectionCardProps[] = [
      testCollectionItem({
        tags: [{ category: "Body parts", selected: ["Brain"] }],
        title: "Item 1",
      }),
      testCollectionItem({
        title: "Item 2",
        // No tags property
        id: "item2",
        description: "Description 2",
        date: new Date("2023-01-01"),
        image: undefined,
        referenceLinkHref: undefined,
        imageSrc: undefined,
        itemTitle: "Item 2",
      }),
      testCollectionItem({
        date: new Date("2023-01-01"),
        description: "Description 3",
        id: "item3",
        image: undefined,
        imageSrc: undefined,
        itemTitle: "Item 3",
        referenceLinkHref: undefined,
        tags: [], // Empty tags array
        title: "Item 3",
      }),
      testCollectionItem({
        date: new Date("2023-01-01"),
        description: "Description 4",
        id: "item4",
        image: undefined,
        imageSrc: undefined,
        itemTitle: "Item 4",
        referenceLinkHref: undefined,
        tags: [
          { category: "Body parts", selected: [] }, // Empty selected array
        ],
        title: "Item 4",
      }),
    ]

    // Act
    const result = getTagFilters(items)

    // Assert
    expect(result).toEqual([
      {
        display: "pills",
        id: "Body parts",
        items: [{ count: 1, id: "Brain", label: "Brain" }],
        label: "Body parts",
      },
    ])
  })

  it("handles partial tagCategories configuration", () => {
    // Arrange
    const items: ProcessedCollectionCardProps[] = [
      testCollectionItem({
        tags: [
          { category: "Body parts", selected: ["Brain", "Heart"] },
          { category: "Condition", selected: ["Acute"] },
          { category: "Color", selected: ["Red"] },
        ],
        title: "Item 1",
      }),
    ]

    const tagCategories: CollectionPageSchemaType["page"]["tagCategories"] = [
      {
        display: TAG_CATEGORY_DISPLAY_OPTIONS.Pills,
        id: "b-1",
        label: "Body parts",
        options: [
          { id: "bp-heart", label: "Heart" },
          { id: "bp-brain", label: "Brain" },
        ],
      },
      // Note: "Condition" and "Color" are not in tagCategories
    ]

    // Act
    const result = getTagFilters(items, tagCategories)

    // Assert
    expect(result).toEqual([
      {
        display: "pills",
        id: "Body parts",
        items: [
          { count: 1, id: "Heart", label: "Heart" },
          { count: 1, id: "Brain", label: "Brain" },
        ],
        label: "Body parts",
      },
      {
        display: "pills",
        id: "Condition",
        items: [{ count: 1, id: "Acute", label: "Acute" }],
        label: "Condition",
      },
      {
        display: "pills",
        id: "Color",
        items: [{ count: 1, id: "Red", label: "Red" }],
        label: "Color",
      },
    ])
  })
})
