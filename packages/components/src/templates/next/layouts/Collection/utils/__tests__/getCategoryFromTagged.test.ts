import type { CollectionPageSchemaType } from "~/types"
import { describe, expect, it } from "vitest"

import { getCategoryFromTagged } from "../getCategoryFromTagged"

describe("getCategoryFromTagged", () => {
  it("returns the label of the matching option in the last tagCategories group", () => {
    // Arrange
    const tagCategories: CollectionPageSchemaType["page"]["tagCategories"] = [
      {
        label: "Topic",
        id: "topic-1",
        display: "pills",
        options: [{ label: "Health", id: "topic-opt-1" }],
      },
      {
        label: "Category",
        id: "cat-1",
        display: "pills",
        options: [
          { label: "Guides", id: "cat-opt-1" },
          { label: "Articles", id: "cat-opt-2" },
        ],
      },
    ]

    // Act
    const result = getCategoryFromTagged(["cat-opt-1"], tagCategories)

    // Assert
    expect(result).toBe("Guides")
  })

  it("joins multiple selected options in the last group with a comma", () => {
    // Arrange
    const tagCategories: CollectionPageSchemaType["page"]["tagCategories"] = [
      {
        label: "Category",
        id: "cat-1",
        display: "pills",
        options: [
          { label: "Guides", id: "cat-opt-1" },
          { label: "Articles", id: "cat-opt-2" },
        ],
      },
    ]

    // Act
    const result = getCategoryFromTagged(
      ["cat-opt-1", "cat-opt-2"],
      tagCategories,
    )

    // Assert
    expect(result).toBe("Guides, Articles")
  })

  it("ignores tagged options that belong to a group other than the last one", () => {
    // Arrange
    const tagCategories: CollectionPageSchemaType["page"]["tagCategories"] = [
      {
        label: "Topic",
        id: "topic-1",
        display: "pills",
        options: [{ label: "Health", id: "topic-opt-1" }],
      },
      {
        label: "Category",
        id: "cat-1",
        display: "pills",
        options: [{ label: "Guides", id: "cat-opt-1" }],
      },
    ]

    // Act
    const result = getCategoryFromTagged(["topic-opt-1"], tagCategories)

    // Assert
    expect(result).toBeUndefined()
  })

  it("returns undefined when tagCategories is undefined", () => {
    expect(getCategoryFromTagged(["cat-opt-1"], undefined)).toBeUndefined()
  })

  it("returns undefined when tagCategories is empty", () => {
    expect(getCategoryFromTagged(["cat-opt-1"], [])).toBeUndefined()
  })

  it("returns undefined when tagged is undefined", () => {
    // Arrange
    const tagCategories: CollectionPageSchemaType["page"]["tagCategories"] = [
      {
        label: "Category",
        id: "cat-1",
        display: "pills",
        options: [{ label: "Guides", id: "cat-opt-1" }],
      },
    ]

    // Act + Assert
    expect(getCategoryFromTagged(undefined, tagCategories)).toBeUndefined()
  })

  it("returns undefined when no tagged option matches the last group", () => {
    // Arrange
    const tagCategories: CollectionPageSchemaType["page"]["tagCategories"] = [
      {
        label: "Category",
        id: "cat-1",
        display: "pills",
        options: [{ label: "Guides", id: "cat-opt-1" }],
      },
    ]

    // Act + Assert
    expect(
      getCategoryFromTagged(["unrelated-id"], tagCategories),
    ).toBeUndefined()
  })

  it("preserves the last group's options order, not the tagged array's order", () => {
    // Arrange
    const tagCategories: CollectionPageSchemaType["page"]["tagCategories"] = [
      {
        label: "Category",
        id: "cat-1",
        display: "pills",
        options: [
          { label: "Guides", id: "cat-opt-1" },
          { label: "Articles", id: "cat-opt-2" },
        ],
      },
    ]

    // Act — tagged lists "Articles" before "Guides", options order should still win
    const result = getCategoryFromTagged(
      ["cat-opt-2", "cat-opt-1"],
      tagCategories,
    )

    // Assert
    expect(result).toBe("Guides, Articles")
  })
})
