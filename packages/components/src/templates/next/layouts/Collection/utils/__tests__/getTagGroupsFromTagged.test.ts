import type { CollectionPageSchemaType } from "~/types"
import { describe, expect, it } from "vitest"
import { TAG_CATEGORY_DISPLAY_OPTIONS } from "~/types/constants"

import { getTagGroupsFromTagged } from "../getTagGroupsFromTagged"

describe("getTagGroupsFromTagged", () => {
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
    const result = getTagGroupsFromTagged({
      tagged: undefined,
      tagCategories,
    })

    // Assert
    expect(result).toEqual({
      pillTags: undefined,
      plaintextTags: undefined,
      allTags: undefined,
    })
  })

  it("returns undefined for both when tagCategories is undefined", () => {
    // Act
    const result = getTagGroupsFromTagged({
      tagged: ["topic-opt-1"],
      tagCategories: undefined,
    })

    // Assert
    expect(result).toEqual({
      pillTags: undefined,
      plaintextTags: undefined,
      allTags: undefined,
    })
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
    const result = getTagGroupsFromTagged({
      tagged: ["topic-opt-1", "cat-opt-1"],
      tagCategories,
    })

    // Assert
    expect(result.pillTags).toEqual([
      { id: "topic-1", label: "Topic", selected: ["Health"] },
    ])
    expect(result.plaintextTags).toEqual([
      { id: "cat-1", label: "Category", selected: ["Guides"] },
    ])
    expect(result.allTags).toEqual([
      { id: "topic-1", label: "Topic", selected: ["Health"] },
      { id: "cat-1", label: "Category", selected: ["Guides"] },
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
    const result = getTagGroupsFromTagged({
      tagged: ["topic-opt-1"],
      tagCategories,
    })

    // Assert
    expect(result.pillTags).toEqual([
      { id: "topic-1", label: "Topic", selected: ["Health"] },
    ])
    expect(result.plaintextTags).toEqual([])
    expect(result.allTags).toEqual([
      { id: "topic-1", label: "Topic", selected: ["Health"] },
    ])
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
    const result = getTagGroupsFromTagged({
      tagged: [],
      tagCategories,
    })

    // Assert
    expect(result.pillTags).toEqual([])
    expect(result.plaintextTags).toEqual([])
    expect(result.allTags).toEqual([])
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
    const result = getTagGroupsFromTagged({
      tagged: ["cat-opt-1", "cat-opt-2"],
      tagCategories,
    })

    // Assert
    expect(result.plaintextTags).toEqual([
      { id: "cat-1", label: "Category", selected: ["Guides", "Articles"] },
    ])
    expect(result.allTags).toEqual([
      { id: "cat-1", label: "Category", selected: ["Guides", "Articles"] },
    ])
  })
})
