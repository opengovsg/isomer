import type { IsomerSchema } from "@opengovsg/isomer-components"

import {
  keepMatchingArrayFields,
  pickMatchingArrayFields,
  stripInactiveCombinatorFields,
} from "../combinatorArrayFields"

const compactItemSchema = {
  properties: {
    label: { type: "string" },
  },
}

const detailedItemSchema = {
  properties: {
    label: { type: "string" },
    icon: { type: "string" },
  },
}

const compactVariantSchema = {
  properties: {
    variant: { const: "compact" },
    widgets: { items: compactItemSchema },
  },
}

const detailedVariantSchema = {
  properties: {
    variant: { const: "detailed" },
    widgets: { items: detailedItemSchema },
  },
}

const pageWith = (block: Record<string, unknown>): IsomerSchema =>
  ({
    version: "0.1.0",
    layout: "content",
    page: { title: "Page", permalink: "page" },
    content: [block],
  }) as unknown as IsomerSchema

describe("keepMatchingArrayFields", () => {
  it("keeps existing items and their shared fields when switching to a variant with more fields", () => {
    // Arrange
    const oldData = {
      variant: "compact",
      widgets: [{ label: "One" }, { label: "Two" }],
    }

    // Act
    const preserved = keepMatchingArrayFields(oldData, detailedVariantSchema)

    // Assert
    expect(preserved).toStrictEqual({
      widgets: [{ label: "One" }, { label: "Two" }],
    })
  })

  it("retains extra fields when switching to a variant with fewer fields", () => {
    // Arrange
    const oldData = {
      variant: "detailed",
      widgets: [{ label: "One", icon: "star" }],
    }

    // Act
    const preserved = keepMatchingArrayFields(oldData, compactVariantSchema)

    // Assert
    expect(preserved).toStrictEqual({
      widgets: [{ label: "One", icon: "star" }],
    })
  })

  it("restores extra fields when switching back to a variant that uses them", () => {
    // Arrange
    const detailed = {
      variant: "detailed",
      widgets: [{ label: "One", icon: "star" }],
    }

    // Act
    const onCompact = keepMatchingArrayFields(detailed, compactVariantSchema)
    const backToDetailed = keepMatchingArrayFields(
      { variant: "compact", ...onCompact },
      detailedVariantSchema,
    )

    // Assert
    expect(backToDetailed).toStrictEqual({
      widgets: detailed.widgets,
    })
  })

  it("never resets the array to empty when switching variants", () => {
    // Arrange
    const oldData = {
      variant: "compact",
      widgets: [{ label: "Only" }],
    }

    // Act
    const preserved = keepMatchingArrayFields(oldData, detailedVariantSchema)

    // Assert
    expect(preserved.widgets).toHaveLength(1)
  })
})

describe("pickMatchingArrayFields", () => {
  it("drops array-item fields that the target schema does not list", () => {
    // Arrange
    const data = {
      variant: "compact",
      widgets: [{ label: "One", icon: "star" }],
    }

    // Act
    const picked = pickMatchingArrayFields(data, compactVariantSchema)

    // Assert
    expect(picked).toStrictEqual({
      widgets: [{ label: "One" }],
    })
  })
})

describe("stripInactiveCombinatorFields", () => {
  it("strips extra item fields using the matching component combinator branch", () => {
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
    const result = stripInactiveCombinatorFields(page)
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

  it("strips fields omitted by a different combinator branch of the same component", () => {
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
    const result = stripInactiveCombinatorFields(page)
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

  it("leaves the matching branch's own fields in place", () => {
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
    const result = stripInactiveCombinatorFields(page)
    const block = result.content[0]

    // Assert
    expect(block?.type).toBe("infocards")
    if (block?.type !== "infocards") {
      return
    }
    expect(block.cards).toEqual(cards)
  })

  it("leaves blocks without a combinator variant unchanged", () => {
    // Arrange
    const page = pageWith({
      type: "prose",
      content: [],
    })

    // Act
    const result = stripInactiveCombinatorFields(page)

    // Assert
    expect(result.content[0]).toEqual({ type: "prose", content: [] })
  })
})
