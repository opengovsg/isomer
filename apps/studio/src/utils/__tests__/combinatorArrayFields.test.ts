import type { IsomerSchema } from "@opengovsg/isomer-components"

import {
  keepMatchingArrayFields,
  serializePageBlob,
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

function infocardsFrom(page: IsomerSchema) {
  const block = page.content[0]
  expect(block?.type).toBe("infocards")
  if (block?.type !== "infocards") {
    throw new Error("expected infocards block")
  }
  return block
}

describe("keepMatchingArrayFields", () => {
  it("keeps array items when the variant schema grows", () => {
    const oldData = {
      variant: "compact",
      widgets: [{ label: "One" }, { label: "Two" }],
    }

    expect(
      keepMatchingArrayFields(oldData, detailedVariantSchema),
    ).toStrictEqual({
      widgets: [{ label: "One" }, { label: "Two" }],
    })
  })

  it("keeps extra item fields when the variant schema shrinks", () => {
    const oldData = {
      variant: "detailed",
      widgets: [{ label: "One", icon: "star" }],
    }

    expect(
      keepMatchingArrayFields(oldData, compactVariantSchema),
    ).toStrictEqual({
      widgets: [{ label: "One", icon: "star" }],
    })
  })

  it("round-trips extra fields across two variant switches", () => {
    const detailed = {
      variant: "detailed",
      widgets: [{ label: "One", icon: "star" }],
    }

    const onCompact = keepMatchingArrayFields(detailed, compactVariantSchema)
    const backToDetailed = keepMatchingArrayFields(
      { variant: "compact", ...onCompact },
      detailedVariantSchema,
    )

    expect(backToDetailed).toStrictEqual({
      widgets: detailed.widgets,
    })
  })
})

describe("stripInactiveCombinatorFields", () => {
  it("drops image fields for cardsWithoutImages", () => {
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

    expect(infocardsFrom(stripInactiveCombinatorFields(page)).cards[0]).toEqual(
      {
        title: "Card 1",
        description: "Desc 1",
        url: "/a",
      },
    )
  })

  it("drops description for cardsWithFullImages", () => {
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

    expect(infocardsFrom(stripInactiveCombinatorFields(page)).cards[0]).toEqual(
      {
        title: "Card 1",
        imageUrl: "/img.png",
        imageAlt: "alt text",
      },
    )
  })

  it("keeps fields that belong to the active branch", () => {
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

    expect(infocardsFrom(stripInactiveCombinatorFields(page)).cards).toEqual(
      cards,
    )
  })

  it("ignores blocks without a combinator variant", () => {
    const page = pageWith({
      type: "prose",
      content: [],
    })

    expect(stripInactiveCombinatorFields(page).content[0]).toEqual({
      type: "prose",
      content: [],
    })
  })
})

describe("serializePageBlob", () => {
  it("strips the save payload but leaves editor state alone", () => {
    const page = pageWith({
      type: "infocards",
      title: "Cards",
      variant: "cardsWithoutImages",
      cards: [
        {
          title: "Card 1",
          imageUrl: "/img.png",
          imageAlt: "alt text",
        },
      ],
    })

    const payload = JSON.parse(serializePageBlob(page)) as IsomerSchema

    expect(infocardsFrom(payload).cards[0]).toEqual({ title: "Card 1" })
    expect(infocardsFrom(page).cards[0]).toMatchObject({
      title: "Card 1",
      imageUrl: "/img.png",
      imageAlt: "alt text",
    })
  })
})
