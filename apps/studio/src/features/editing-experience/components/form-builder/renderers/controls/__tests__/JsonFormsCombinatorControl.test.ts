import type { JsonSchema7 } from "@jsonforms/core"

import { keepMatchingArrayFields } from "../JsonFormsCombinatorControl"

// Mirrors the shape of the InfoCards oneOf branches (variant const + a
// `cards` array of objects), simplified to the fields relevant to the merge.
const noImageCardItemSchema: JsonSchema7 = {
  type: "object",
  properties: {
    title: { type: "string" },
    description: { type: "string" },
    url: { type: "string" },
  },
}

const withImageCardItemSchema: JsonSchema7 = {
  type: "object",
  properties: {
    title: { type: "string" },
    description: { type: "string" },
    url: { type: "string" },
    imageUrl: { type: "string" },
    imageAlt: { type: "string" },
  },
}

const noImageVariantSchema: JsonSchema7 = {
  type: "object",
  properties: {
    variant: { const: "cardsWithoutImages" },
    cards: { type: "array", items: noImageCardItemSchema },
  },
}

const withImageVariantSchema: JsonSchema7 = {
  type: "object",
  properties: {
    variant: { const: "cardsWithImages" },
    cards: { type: "array", items: withImageCardItemSchema },
  },
}

describe("keepMatchingArrayFields", () => {
  it("keeps existing cards and their shared fields when switching to a variant with more fields", () => {
    const oldData = {
      variant: "cardsWithoutImages",
      cards: [
        { title: "Card 1", description: "Desc 1", url: "/a" },
        { title: "Card 2" },
      ],
    }

    const preserved = keepMatchingArrayFields(oldData, withImageVariantSchema)

    // Fields the new variant adds (imageUrl/imageAlt) are left unset, same
    // as they would be on a freshly added card, rather than being invented.
    expect(preserved).toStrictEqual({
      cards: [
        { title: "Card 1", description: "Desc 1", url: "/a" },
        { title: "Card 2" },
      ],
    })
  })

  it("drops fields no longer present in the schema when switching to a variant with fewer fields", () => {
    const oldData = {
      variant: "cardsWithImages",
      cards: [
        {
          title: "Card 1",
          description: "Desc 1",
          url: "/a",
          imageUrl: "https://example.com/image.png",
          imageAlt: "alt text",
        },
      ],
    }

    const preserved = keepMatchingArrayFields(oldData, noImageVariantSchema)

    expect(preserved).toStrictEqual({
      cards: [{ title: "Card 1", description: "Desc 1", url: "/a" }],
    })
  })

  it("never resets the cards array to empty when switching variants", () => {
    const oldData = {
      variant: "cardsWithoutImages",
      cards: [{ title: "Only card" }],
    }

    const preserved = keepMatchingArrayFields(oldData, withImageVariantSchema)

    expect(preserved.cards).toHaveLength(1)
  })
})
