import type { IsomerSchema } from "@opengovsg/isomer-components"

import { stripInactiveInfoCardFields } from "../stripInactiveInfoCardFields"

const pageWith = (block: Record<string, unknown>): IsomerSchema =>
  ({
    version: "0.1.0",
    layout: "content",
    page: { title: "Page", permalink: "page" },
    content: [block],
  }) as unknown as IsomerSchema

describe("stripInactiveInfoCardFields", () => {
  it("removes image fields when the variant is cards without images", () => {
    // Arrange
    const page = pageWith({
      type: "infocards",
      title: "Cards",
      variant: "cardsWithoutImages",
      cards: [
        {
          title: "Card 1",
          description: "Desc 1",
          url: "/a",
          imageUrl: "/img.png",
          imageAlt: "alt text",
          imageFit: "cover",
        },
      ],
    })

    // Act
    const result = stripInactiveInfoCardFields(page)
    const block = result.content[0]

    // Assert
    expect(block?.type).toBe("infocards")
    if (block?.type !== "infocards") {
      return
    }
    expect(block.cards[0]).toEqual({
      title: "Card 1",
      description: "Desc 1",
      url: "/a",
    })
  })

  it("removes description when the variant is cards with full images", () => {
    // Arrange
    const page = pageWith({
      type: "infocards",
      title: "Cards",
      variant: "cardsWithFullImages",
      cards: [
        {
          title: "Card 1",
          description: "Should go",
          imageUrl: "/img.png",
          imageAlt: "alt text",
        },
      ],
    })

    // Act
    const result = stripInactiveInfoCardFields(page)
    const block = result.content[0]

    // Assert
    expect(block?.type).toBe("infocards")
    if (block?.type !== "infocards") {
      return
    }
    expect(block.cards[0]).toEqual({
      title: "Card 1",
      imageUrl: "/img.png",
      imageAlt: "alt text",
    })
  })

  it("leaves cards with images unchanged", () => {
    // Arrange
    const cards = [
      {
        title: "Card 1",
        description: "Desc 1",
        imageUrl: "/img.png",
        imageAlt: "alt text",
      },
    ]
    const page = pageWith({
      type: "infocards",
      title: "Cards",
      variant: "cardsWithImages",
      cards,
    })

    // Act
    const result = stripInactiveInfoCardFields(page)
    const block = result.content[0]

    // Assert
    expect(block?.type).toBe("infocards")
    if (block?.type !== "infocards") {
      return
    }
    expect(block.cards).toEqual(cards)
  })

  it("leaves non-infocards blocks unchanged", () => {
    // Arrange
    const page = pageWith({
      type: "prose",
      content: [],
    })

    // Act
    const result = stripInactiveInfoCardFields(page)

    // Assert
    expect(result.content[0]).toEqual({ type: "prose", content: [] })
  })
})
