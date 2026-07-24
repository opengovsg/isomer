import type { CollectionPageSchemaType } from "~/types"
import { describe, expect, it } from "vitest"
import { TAG_CATEGORY_DISPLAY_OPTIONS } from "~/types/constants"

import { getPillAndPlaintextTags } from "../getPillAndPlaintextTags"

describe("getPillAndPlaintextTags", () => {
  it("returns undefined for both when tagged is undefined", () => {
    // Arrange
    const tagCategories: CollectionPageSchemaType["page"]["tagCategories"] = [
      {
        label: "Topic",
        id: "topic-1",
        display: TAG_CATEGORY_DISPLAY_OPTIONS.Pills,
        options: [{ label: "Health", id: "topic-opt-1" }],
      },
    ]

    // Act
    const result = getPillAndPlaintextTags(undefined, tagCategories)

    // Assert
    expect(result).toEqual({ pillTags: undefined, plaintextTags: undefined })
  })

  it("returns undefined for both when tagCategories is undefined", () => {
    // Act
    const result = getPillAndPlaintextTags(["topic-opt-1"], undefined)

    // Assert
    expect(result).toEqual({ pillTags: undefined, plaintextTags: undefined })
  })

  it("splits selected groups into pillTags and plaintextTags by display", () => {
    // Arrange
    const tagCategories: CollectionPageSchemaType["page"]["tagCategories"] = [
      {
        label: "Topic",
        id: "topic-1",
        display: TAG_CATEGORY_DISPLAY_OPTIONS.Pills,
        options: [{ label: "Health", id: "topic-opt-1" }],
      },
      {
        label: "Category",
        id: "cat-1",
        display: TAG_CATEGORY_DISPLAY_OPTIONS.Plaintext,
        options: [{ label: "Guides", id: "cat-opt-1" }],
      },
    ]

    // Act
    const result = getPillAndPlaintextTags(
      ["topic-opt-1", "cat-opt-1"],
      tagCategories,
    )

    // Assert
    expect(result.pillTags).toEqual([
      { id: "topic-1", category: "Topic", selected: ["Health"] },
    ])
    expect(result.plaintextTags).toEqual([
      { id: "cat-1", category: "Category", selected: ["Guides"] },
    ])
  })

  it("treats a group without a display value as pills, per the default", () => {
    // Arrange
    const tagCategories: CollectionPageSchemaType["page"]["tagCategories"] = [
      {
        label: "Topic",
        id: "topic-1",
        options: [{ label: "Health", id: "topic-opt-1" }],
      },
    ]

    // Act
    const result = getPillAndPlaintextTags(["topic-opt-1"], tagCategories)

    // Assert
    expect(result.pillTags).toEqual([
      { id: "topic-1", category: "Topic", selected: ["Health"] },
    ])
    expect(result.plaintextTags).toEqual([])
  })

  it("excludes a group entirely from both lists when none of its options are selected", () => {
    // Arrange
    const tagCategories: CollectionPageSchemaType["page"]["tagCategories"] = [
      {
        label: "Topic",
        id: "topic-1",
        display: TAG_CATEGORY_DISPLAY_OPTIONS.Pills,
        options: [{ label: "Health", id: "topic-opt-1" }],
      },
      {
        label: "Category",
        id: "cat-1",
        display: TAG_CATEGORY_DISPLAY_OPTIONS.Plaintext,
        options: [{ label: "Guides", id: "cat-opt-1" }],
      },
    ]

    // Act
    const result = getPillAndPlaintextTags([], tagCategories)

    // Assert
    expect(result.pillTags).toEqual([])
    expect(result.plaintextTags).toEqual([])
  })

  it("keeps all selected options for a group, uncombined (joining is a render concern)", () => {
    // Arrange
    const tagCategories: CollectionPageSchemaType["page"]["tagCategories"] = [
      {
        label: "Category",
        id: "cat-1",
        display: TAG_CATEGORY_DISPLAY_OPTIONS.Plaintext,
        options: [
          { label: "Guides", id: "cat-opt-1" },
          { label: "Articles", id: "cat-opt-2" },
        ],
      },
    ]

    // Act
    const result = getPillAndPlaintextTags(
      ["cat-opt-1", "cat-opt-2"],
      tagCategories,
    )

    // Assert
    expect(result.plaintextTags).toEqual([
      { id: "cat-1", category: "Category", selected: ["Guides", "Articles"] },
    ])
  })
})
