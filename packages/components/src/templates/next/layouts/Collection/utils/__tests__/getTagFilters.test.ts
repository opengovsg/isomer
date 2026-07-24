import type { ProcessedCollectionCardProps } from "~/interfaces"
import type { CollectionPageSchemaType } from "~/types"
import { describe, expect, it } from "vitest"
import { TAG_CATEGORY_DISPLAY_OPTIONS } from "~/types/constants"

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
      } as ProcessedCollectionCardProps,
      {
        title: "Item 2",
        tags: [
          { selected: ["Brain"], category: "Body parts" },
          { selected: ["Chronic"], category: "Condition" },
        ],
      } as ProcessedCollectionCardProps,
    ]

    // Act
    const result = getTagFilters(items)

    // Assert
    expect(result).toEqual([
      {
        id: "Body parts",
        label: "Body parts",
        display: "pills",
        items: [
          { id: "Brain", label: "Brain", count: 2 },
          { id: "Heart", label: "Heart", count: 1 },
        ],
      },
      {
        id: "Condition",
        label: "Condition",
        display: "pills",
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
      } as ProcessedCollectionCardProps,
    ]

    const tagCategories: CollectionPageSchemaType["page"]["tagCategories"] = [
      {
        label: "Condition",
        id: "c-1",
        display: TAG_CATEGORY_DISPLAY_OPTIONS.Pills,
        options: [{ label: "Acute", id: "o-1" }],
      },
      {
        label: "Body parts",
        id: "b-1",
        display: TAG_CATEGORY_DISPLAY_OPTIONS.Pills,
        options: [{ label: "Brain", id: "o-2" }],
      },
    ]

    // Act
    const result = getTagFilters(items, tagCategories)

    // Assert
    expect(result).toEqual([
      {
        id: "c-1",
        label: "Condition",
        display: "pills",
        items: [{ id: "Acute", label: "Acute", count: 1 }],
      },
      {
        id: "b-1",
        label: "Body parts",
        display: "pills",
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
      } as ProcessedCollectionCardProps,
      {
        title: "Item 2",
        tags: [
          { selected: ["Heart"], category: "Body parts" },
          { selected: ["Chronic"], category: "Condition" },
        ],
      } as ProcessedCollectionCardProps,
    ]

    const tagCategories: CollectionPageSchemaType["page"]["tagCategories"] = [
      {
        label: "Body parts",
        id: "b-1",
        display: TAG_CATEGORY_DISPLAY_OPTIONS.Pills,
        options: [
          { label: "Heart", id: "bp-heart" },
          { label: "Brain", id: "bp-brain" },
          { label: "Leg", id: "bp-leg" },
        ],
      },
      {
        label: "Condition",
        id: "c-1",
        display: TAG_CATEGORY_DISPLAY_OPTIONS.Pills,
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
        id: "b-1",
        label: "Body parts",
        display: "pills",
        items: [
          { id: "Arm", label: "Arm", count: 1 }, // Unlisted; comes first
          { id: "Heart", label: "Heart", count: 1 },
          { id: "Brain", label: "Brain", count: 1 },
        ],
      },
      {
        id: "c-1",
        label: "Condition",
        display: "pills",
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
      } as ProcessedCollectionCardProps,
      {
        title: "Item 2",
        tags: [{ selected: ["Apple"], category: "Fruits" }],
      } as ProcessedCollectionCardProps,
      {
        title: "Item 3",
        tags: [{ selected: ["Banana"], category: "Fruits" }],
      } as ProcessedCollectionCardProps,
    ]

    // Act
    const result = getTagFilters(items)

    // Assert
    expect(result).toEqual([
      {
        id: "Fruits",
        label: "Fruits",
        display: "pills",
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

  it("handles mixed scenarios: some categories in tagCategories, some not", () => {
    // Arrange
    const items: ProcessedCollectionCardProps[] = [
      {
        title: "Item 1",
        tags: [
          { selected: ["Brain"], category: "Body parts" },
          { selected: ["Acute"], category: "Condition" },
          { selected: ["Red"], category: "Color" },
        ],
      } as ProcessedCollectionCardProps,
      {
        title: "Item 2",
        tags: [
          { selected: ["Heart"], category: "Body parts" },
          { selected: ["Blue"], category: "Color" },
        ],
      } as ProcessedCollectionCardProps,
    ]

    const tagCategories: CollectionPageSchemaType["page"]["tagCategories"] = [
      {
        label: "Condition",
        id: "c-1",
        display: TAG_CATEGORY_DISPLAY_OPTIONS.Pills,
        options: [
          { label: "Acute", id: "c-acute" },
          { label: "Chronic", id: "c-chronic" },
        ],
      },
      {
        label: "Body parts",
        id: "b-1",
        display: TAG_CATEGORY_DISPLAY_OPTIONS.Pills,
        options: [
          { label: "Heart", id: "bp-heart" },
          { label: "Brain", id: "bp-brain" },
        ],
      },
      // Note: "Color" category is NOT in tagCategories
    ]

    // Act
    const result = getTagFilters(items, tagCategories)

    // Assert
    expect(result).toEqual([
      {
        id: "c-1",
        label: "Condition",
        display: "pills",
        items: [{ id: "Acute", label: "Acute", count: 1 }],
      },
      {
        id: "b-1",
        label: "Body parts",
        display: "pills",
        items: [
          { id: "Heart", label: "Heart", count: 1 },
          { id: "Brain", label: "Brain", count: 1 },
        ],
      },
      {
        id: "Color",
        label: "Color",
        display: "pills",
        items: [
          { id: "Red", label: "Red", count: 1 },
          { id: "Blue", label: "Blue", count: 1 },
        ],
      },
    ])
  })

  it("handles empty options arrays in tagCategories", () => {
    // Arrange
    const items: ProcessedCollectionCardProps[] = [
      {
        title: "Item 1",
        tags: [
          { selected: ["Brain", "Heart"], category: "Body parts" },
          { selected: ["Acute"], category: "Condition" },
        ],
      } as ProcessedCollectionCardProps,
    ]

    const tagCategories: CollectionPageSchemaType["page"]["tagCategories"] = [
      {
        label: "Condition",
        id: "c-1",
        display: TAG_CATEGORY_DISPLAY_OPTIONS.Pills,
        options: [], // Empty options array
      },
      {
        label: "Body parts",
        id: "b-1",
        display: TAG_CATEGORY_DISPLAY_OPTIONS.Pills,
        options: [
          { label: "Heart", id: "bp-heart" },
          { label: "Brain", id: "bp-brain" },
        ],
      },
    ]

    // Act
    const result = getTagFilters(items, tagCategories)

    // Assert
    expect(result).toEqual([
      {
        id: "c-1",
        label: "Condition",
        display: "pills",
        items: [{ id: "Acute", label: "Acute", count: 1 }], // Unlisted item appears first
      },
      {
        id: "b-1",
        label: "Body parts",
        display: "pills",
        items: [
          { id: "Heart", label: "Heart", count: 1 },
          { id: "Brain", label: "Brain", count: 1 },
        ],
      },
    ])
  })

  it("handles duplicate tags across multiple items correctly", () => {
    // Arrange
    const items: ProcessedCollectionCardProps[] = [
      {
        title: "Item 1",
        tags: [
          { selected: ["Brain", "Heart"], category: "Body parts" },
          { selected: ["Acute"], category: "Condition" },
        ],
      } as ProcessedCollectionCardProps,
      {
        title: "Item 2",
        tags: [
          { selected: ["Brain"], category: "Body parts" },
          { selected: ["Acute", "Chronic"], category: "Condition" },
        ],
      } as ProcessedCollectionCardProps,
      {
        title: "Item 3",
        tags: [
          { selected: ["Heart"], category: "Body parts" },
          { selected: ["Acute"], category: "Condition" },
        ],
      } as ProcessedCollectionCardProps,
    ]

    // Act
    const result = getTagFilters(items)

    // Assert
    expect(result).toEqual([
      {
        id: "Body parts",
        label: "Body parts",
        display: "pills",
        items: [
          { id: "Brain", label: "Brain", count: 2 }, // Appears in 2 items
          { id: "Heart", label: "Heart", count: 2 }, // Appears in 2 items
        ],
      },
      {
        id: "Condition",
        label: "Condition",
        display: "pills",
        items: [
          { id: "Acute", label: "Acute", count: 3 }, // Appears in 3 items
          { id: "Chronic", label: "Chronic", count: 1 }, // Appears in 1 item
        ],
      },
    ])
  })

  it("handles items with no tags gracefully", () => {
    // Arrange
    const items: ProcessedCollectionCardProps[] = [
      {
        title: "Item 1",
        tags: [{ selected: ["Brain"], category: "Body parts" }],
      } as ProcessedCollectionCardProps,
      {
        title: "Item 2",
        // No tags property
        id: "item2",
        description: "Description 2",
        date: new Date("2023-01-01"),
        image: undefined,
        referenceLinkHref: undefined,
        imageSrc: undefined,
        itemTitle: "Item 2",
      } as ProcessedCollectionCardProps,
      {
        title: "Item 3",
        tags: [], // Empty tags array
        id: "item3",
        description: "Description 3",
        date: new Date("2023-01-01"),
        image: undefined,
        referenceLinkHref: undefined,
        imageSrc: undefined,
        itemTitle: "Item 3",
      } as unknown as ProcessedCollectionCardProps,
      {
        title: "Item 4",
        tags: [
          { selected: [], category: "Body parts" }, // Empty selected array
        ],
        id: "item4",
        description: "Description 4",
        date: new Date("2023-01-01"),
        image: undefined,
        referenceLinkHref: undefined,
        imageSrc: undefined,
        itemTitle: "Item 4",
      } as unknown as ProcessedCollectionCardProps,
    ]

    // Act
    const result = getTagFilters(items)

    // Assert
    expect(result).toEqual([
      {
        id: "Body parts",
        label: "Body parts",
        display: "pills",
        items: [{ id: "Brain", label: "Brain", count: 1 }],
      },
    ])
  })

  it("handles partial tagCategories configuration", () => {
    // Arrange
    const items: ProcessedCollectionCardProps[] = [
      {
        title: "Item 1",
        tags: [
          { selected: ["Brain", "Heart"], category: "Body parts" },
          { selected: ["Acute"], category: "Condition" },
          { selected: ["Red"], category: "Color" },
        ],
      } as ProcessedCollectionCardProps,
    ]

    const tagCategories: CollectionPageSchemaType["page"]["tagCategories"] = [
      {
        label: "Body parts",
        id: "b-1",
        display: TAG_CATEGORY_DISPLAY_OPTIONS.Pills,
        options: [
          { label: "Heart", id: "bp-heart" },
          { label: "Brain", id: "bp-brain" },
        ],
      },
      // Note: "Condition" and "Color" are not in tagCategories
    ]

    // Act
    const result = getTagFilters(items, tagCategories)

    // Assert
    expect(result).toEqual([
      {
        id: "b-1",
        label: "Body parts",
        display: "pills",
        items: [
          { id: "Heart", label: "Heart", count: 1 },
          { id: "Brain", label: "Brain", count: 1 },
        ],
      },
      {
        id: "Condition",
        label: "Condition",
        display: "pills",
        items: [{ id: "Acute", label: "Acute", count: 1 }],
      },
      {
        id: "Color",
        label: "Color",
        display: "pills",
        items: [{ id: "Red", label: "Red", count: 1 }],
      },
    ])
  })

  it("keeps tag categories with duplicate labels as separate filters keyed by id", () => {
    // Arrange
    const items: ProcessedCollectionCardProps[] = [
      {
        title: "Item 1",
        tags: [
          { id: "region-1", selected: ["North"], category: "Region" },
          { id: "region-2", selected: ["South"], category: "Region" },
        ],
      } as ProcessedCollectionCardProps,
    ]

    const tagCategories: CollectionPageSchemaType["page"]["tagCategories"] = [
      {
        label: "Region",
        id: "region-1",
        display: TAG_CATEGORY_DISPLAY_OPTIONS.Pills,
        options: [{ label: "North", id: "r-north" }],
      },
      {
        label: "Region",
        id: "region-2",
        display: TAG_CATEGORY_DISPLAY_OPTIONS.Pills,
        options: [{ label: "South", id: "r-south" }],
      },
    ]

    // Act
    const result = getTagFilters(items, tagCategories)

    // Assert
    expect(result).toEqual([
      {
        id: "region-1",
        label: "Region",
        display: "pills",
        items: [{ id: "North", label: "North", count: 1 }],
      },
      {
        id: "region-2",
        label: "Region",
        display: "pills",
        items: [{ id: "South", label: "South", count: 1 }],
      },
    ])
  })
})
