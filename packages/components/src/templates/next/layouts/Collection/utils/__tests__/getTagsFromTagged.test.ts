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
          label: "Topic",
          id: "topic-1",
          options: [
            { label: "Health", id: "topic-opt-1" },
            { label: "Education", id: "topic-opt-2" },
          ],
        },
      ]

    // Act
    const result = getTagsFromTagged(tagged, tagCategories)

    // Assert
    expect(result).toEqual([
      { id: "topic-1", category: "Topic", selected: ["Health"] },
    ])
  })

  it('assigns "Others" when the Category group has no tagged option', () => {
    // Arrange
    const tagged: NonNullable<ArticlePagePageProps["tagged"]> = ["topic-opt-1"]
    const tagCategories: NonNullable<CollectionPagePageProps["tagCategories"]> =
      [
        {
          label: "Topic",
          id: "topic-1",
          options: [{ label: "Health", id: "topic-opt-1" }],
        },
        {
          label: "Category",
          id: "cat-1",
          options: [{ label: "Guides", id: "cat-opt-1" }],
        },
      ]

    // Act
    const result = getTagsFromTagged(tagged, tagCategories)

    // Assert
    expect(result).toEqual([
      { id: "topic-1", category: "Topic", selected: ["Health"] },
      { id: "cat-1", category: "Category", selected: ["Others"] },
    ])
  })

  it('assigns "Others" for Category when tagged is empty', () => {
    // Arrange
    const tagged: NonNullable<ArticlePagePageProps["tagged"]> = []
    const tagCategories: NonNullable<CollectionPagePageProps["tagCategories"]> =
      [
        {
          label: "Category",
          id: "cat-1",
          options: [{ label: "Guides", id: "cat-opt-1" }],
        },
      ]

    // Act
    const result = getTagsFromTagged(tagged, tagCategories)

    // Assert
    expect(result).toEqual([
      { id: "cat-1", category: "Category", selected: ["Others"] },
    ])
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
          label: "Category",
          id: "cat-1",
          options: [
            { label: "Guides", id: "cat-opt-1" },
            { label: "Articles", id: "cat-opt-2" },
          ],
        },
      ]

    // Act
    const result = getTagsFromTagged(tagged, tagCategories)

    // Assert
    expect(result).toEqual([
      { id: "cat-1", category: "Category", selected: ["Guides", "Articles"] },
    ])
  })
})
