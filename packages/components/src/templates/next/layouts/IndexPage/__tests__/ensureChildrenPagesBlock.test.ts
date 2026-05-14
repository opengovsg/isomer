import type { IndexPageSchemaType } from "~/types"
import { describe, expect, it } from "vitest"
import { DEFAULT_CHILDREN_PAGES_BLOCK } from "~/interfaces/complex/ChildrenPages/constants"

import { ensureChildrenPagesBlock } from "../IndexPage"

describe("ensureChildrenPagesBlock", () => {
  it("returns the same content array when childrenpages block already exists", () => {
    // Arrange
    const content: IndexPageSchemaType["content"] = [
      DEFAULT_CHILDREN_PAGES_BLOCK,
    ]

    // Act
    const result = ensureChildrenPagesBlock(content)

    // Assert
    expect(result).toBe(content)
    expect(result).toHaveLength(1)
  })

  it("appends default childrenpages block when content is missing it", () => {
    // Arrange
    const infocardsBlock = {
      type: "infocards",
      title: "Useful links",
      variant: "cardsWithoutImages",
      cards: [{ title: "Card" }],
    } as IndexPageSchemaType["content"][number]
    const content: IndexPageSchemaType["content"] = [infocardsBlock]

    // Act
    const result = ensureChildrenPagesBlock(content)

    // Assert
    expect(result).toHaveLength(2)
    expect(result[0]).toBe(infocardsBlock)
    expect(result[1]).toBe(DEFAULT_CHILDREN_PAGES_BLOCK)
  })
})
