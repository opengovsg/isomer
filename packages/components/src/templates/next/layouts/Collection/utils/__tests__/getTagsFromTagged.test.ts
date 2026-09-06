import type { ArticlePagePageProps, CollectionPagePageProps } from "~/types"
import { describe, expect, it } from "vitest"

import { getTagsFromTagged } from "../getTagsFromTagged"

describe("getTagsFromTagged", () => {
  it("returns a group with only the selected options' labels", () => {
    // Arrange
    const tagged: NonNullable<ArticlePagePageProps["tagged"]> = ["topic-opt-1"]
    const tagCategories: NonNullable<CollectionPagePageProps["tagCategories"]> =
      [
        {
          id: "topic-1",
          label: "Topic",
          options: [
            { id: "topic-opt-1", label: "Health" },
            { id: "topic-opt-2", label: "Education" },
          ],
        },
      ]

    // Act
    const result = getTagsFromTagged(tagged, tagCategories)

    // Assert
    expect(result).toEqual([
      { category: "Topic", id: "topic-1", selected: ["Health"] },
    ])
  })

  it("excludes a category entirely when none of its options are tagged", () => {
    // Arrange
    const tagged: NonNullable<ArticlePagePageProps["tagged"]> = ["topic-opt-1"]
    const tagCategories: NonNullable<CollectionPagePageProps["tagCategories"]> =
      [
        {
          id: "topic-1",
          label: "Topic",
          options: [{ id: "topic-opt-1", label: "Health" }],
        },
        {
          id: "cat-1",
          label: "Category",
          options: [{ id: "cat-opt-1", label: "Guides" }],
        },
      ]

    // Act
    const result = getTagsFromTagged(tagged, tagCategories)

    // Assert
    expect(result).toEqual([
      { category: "Topic", id: "topic-1", selected: ["Health"] },
    ])
  })

  it("returns an empty array when tagged is empty", () => {
    // Arrange
    const tagged: NonNullable<ArticlePagePageProps["tagged"]> = []
    const tagCategories: NonNullable<CollectionPagePageProps["tagCategories"]> =
      [
        {
          id: "topic-1",
          label: "Topic",
          options: [{ id: "topic-opt-1", label: "Health" }],
        },
      ]

    // Act
    const result = getTagsFromTagged(tagged, tagCategories)

    // Assert
    expect(result).toEqual([])
  })

  it("returns an empty array when tagCategories is empty", () => {
    // Arrange
    const tagged: NonNullable<ArticlePagePageProps["tagged"]> = ["topic-opt-1"]
    const tagCategories: NonNullable<CollectionPagePageProps["tagCategories"]> =
      []

    // Act
    const result = getTagsFromTagged(tagged, tagCategories)

    // Assert
    expect(result).toEqual([])
  })

  it("keeps all tagged options for a category, uncombined", () => {
    // Arrange
    const tagged: NonNullable<ArticlePagePageProps["tagged"]> = [
      "cat-opt-1",
      "cat-opt-2",
    ]
    const tagCategories: NonNullable<CollectionPagePageProps["tagCategories"]> =
      [
        {
          id: "cat-1",
          label: "Category",
          options: [
            { id: "cat-opt-1", label: "Guides" },
            { id: "cat-opt-2", label: "Articles" },
          ],
        },
      ]

    // Act
    const result = getTagsFromTagged(tagged, tagCategories)

    // Assert
    expect(result).toEqual([
      { category: "Category", id: "cat-1", selected: ["Guides", "Articles"] },
    ])
  })
})
