import { describe, expect, it } from "vitest"

import { PLACEHOLDER_IMAGE_FILENAME } from "../../constants"
import {
  CARDS_WITH_FULL_IMAGES,
  CARDS_WITH_IMAGES,
  CARDS_WITHOUT_IMAGES,
  InfoCardsSchema,
} from "../../interfaces/complex/InfoCards"
import {
  convertVariantData,
  defaultHeroCarouselSlide,
} from "../convertVariantData"

type VariantSchema = Parameters<typeof convertVariantData>[2]

const blockSchema = {
  type: "object",
  properties: {
    type: {},
    variant: {},
    backgroundUrl: {},
    title: {},
    subtitle: {},
  },
}

const carouselSchema = {
  type: "object",
  properties: {
    type: {},
    variant: {},
    carousel: {},
    slides: {},
  },
}

// Mirrors HeroGradientSchema (Type.Intersect): fields live under `allOf`/`oneOf`,
// not a top-level `properties` map. The oneOf is the buttons-vs-quick-links layout.
const gradientSchema: VariantSchema = {
  allOf: [
    {
      properties: { type: {}, variant: {}, backgroundUrl: {}, title: {} },
    },
    {
      oneOf: [
        { properties: { actions: {}, buttonLabel: {}, buttonUrl: {} } },
        { properties: { actions: {} } },
      ],
    },
  ],
}

describe("convertVariantData: hero", () => {
  it("keeps the previous hero image on the first slide and placeholders the second", () => {
    // Arrange
    const previous = {
      variant: "block",
      backgroundUrl: "/uploads/existing.png",
      title: "Keep me",
    }

    // Act
    const result = convertVariantData(
      previous,
      { type: "hero", variant: "carousel" },
      carouselSchema,
    )

    // Assert
    expect(result).toEqual({
      type: "hero",
      variant: "carousel",
      carousel: { layout: "block", imagePosition: "right" },
      slides: [
        {
          backgroundUrl: "/uploads/existing.png",
          title: "Keep me",
        },
        defaultHeroCarouselSlide(),
      ],
    })
  })

  it("uses the placeholder image when the previous hero has none", () => {
    // Act
    const result = convertVariantData(
      { variant: "block", title: "Hello" },
      { type: "hero", variant: "carousel" },
      carouselSchema,
    )

    // Assert
    expect(result).toEqual({
      type: "hero",
      variant: "carousel",
      carousel: { layout: "block", imagePosition: "right" },
      slides: [
        { ...defaultHeroCarouselSlide(), title: "Hello" },
        defaultHeroCarouselSlide(),
      ],
    })
    expect(defaultHeroCarouselSlide().backgroundUrl).toBe(
      `/${PLACEHOLDER_IMAGE_FILENAME}`,
    )
  })

  it("keeps shared fields when switching between non-carousel variants", () => {
    // Act
    const result = convertVariantData(
      { type: "hero", variant: "gradient", title: "Hello" },
      { type: "hero", variant: "block" },
      blockSchema,
    )

    // Assert
    expect(result).toEqual({ type: "hero", variant: "block", title: "Hello" })
  })

  it("drops slides and carousel when leaving carousel and keeps the first slide content", () => {
    // Arrange
    const previous = {
      type: "hero",
      variant: "carousel",
      carousel: { layout: "gradient" },
      title: "Stale root title",
      slides: [
        {
          backgroundUrl: "/uploads/existing.png",
          title: "Edited",
          subtitle: "From the slide",
        },
        defaultHeroCarouselSlide(),
      ],
    }

    // Act
    const result = convertVariantData(
      previous,
      { type: "hero", variant: "block" },
      blockSchema,
    )

    // Assert
    expect(result).toEqual({
      type: "hero",
      variant: "block",
      backgroundUrl: "/uploads/existing.png",
      title: "Edited",
      subtitle: "From the slide",
    })
  })

  it("keeps shared fields when switching into gradient (ISOM-2834: allOf-shaped schema)", () => {
    // Act
    const result = convertVariantData(
      {
        type: "hero",
        variant: "block",
        backgroundUrl: "/uploads/existing.png",
        title: "Hello",
      },
      { type: "hero", variant: "gradient" },
      gradientSchema,
    )

    // Assert
    expect(result).toEqual({
      type: "hero",
      variant: "gradient",
      backgroundUrl: "/uploads/existing.png",
      title: "Hello",
    })
  })

  it("keeps button content when switching into gradient (nested under the oneOf action-layout member)", () => {
    // Act
    const result = convertVariantData(
      {
        type: "hero",
        variant: "block",
        title: "Hello",
        buttonLabel: "Learn more",
        buttonUrl: "/about",
      },
      { type: "hero", variant: "gradient" },
      gradientSchema,
    )

    // Assert
    expect(result).toEqual({
      type: "hero",
      variant: "gradient",
      title: "Hello",
      buttonLabel: "Learn more",
      buttonUrl: "/about",
    })
  })

  it("drops root hero fields when entering carousel", () => {
    // Arrange
    const previous = {
      type: "hero",
      variant: "block",
      backgroundUrl: "/uploads/existing.png",
      title: "Hello",
      subtitle: "More",
      carousel: { layout: "gradient" },
      slides: [{ backgroundUrl: "/stale.png" }],
    }

    // Act
    const result = convertVariantData(
      previous,
      { type: "hero", variant: "carousel", carousel: { layout: "block" } },
      carouselSchema,
    )

    // Assert
    expect(result).toEqual({
      type: "hero",
      variant: "carousel",
      carousel: { layout: "block", imagePosition: "right" },
      slides: [
        {
          backgroundUrl: "/uploads/existing.png",
          title: "Hello",
          subtitle: "More",
        },
        defaultHeroCarouselSlide(),
      ],
    })
  })
})

// The real InfoCards style branches, so these tests track schema changes.
const infoCardsStyle = (variant: string) => {
  const { oneOf } = InfoCardsSchema.allOf[1] as unknown as {
    oneOf: (VariantSchema & { properties: { variant: { const: string } } })[]
  }
  const style = oneOf.find(
    (branch) => branch.properties.variant.const === variant,
  )

  if (!style) {
    throw new Error(`No InfoCards style: ${variant}`)
  }

  return style
}

const infoCards = {
  type: "infocards",
  title: "Block title",
  subtitle: "Block subtitle",
  maxColumns: "3",
  variant: "cardsWithImages",
  cards: [
    {
      title: "Card",
      description: "Desc",
      url: "/card",
      imageUrl: "/uploads/card.png",
      imageFit: "cover",
      imageAlt: "A card",
    },
  ],
}

describe("convertVariantData: infocards", () => {
  it("keeps cards and block fields when switching style", () => {
    // Act
    const result = convertVariantData(
      infoCards,
      { variant: "cardsWithoutImages", cards: [] },
      infoCardsStyle(CARDS_WITHOUT_IMAGES),
    )

    // Assert
    expect(result).toEqual({
      type: "infocards",
      title: "Block title",
      subtitle: "Block subtitle",
      maxColumns: "3",
      variant: "cardsWithoutImages",
      cards: [{ title: "Card", description: "Desc", url: "/card" }],
    })
  })

  it("drops descriptions but keeps images when switching to full images", () => {
    // Act
    const result = convertVariantData(
      infoCards,
      { variant: CARDS_WITH_FULL_IMAGES, cards: [] },
      infoCardsStyle(CARDS_WITH_FULL_IMAGES),
    )

    // Assert
    expect(result).toEqual({
      ...infoCards,
      variant: CARDS_WITH_FULL_IMAGES,
      cards: [
        {
          title: "Card",
          url: "/card",
          imageUrl: "/uploads/card.png",
          imageFit: "cover",
          imageAlt: "A card",
        },
      ],
    })
  })

  it("keeps card content when switching into a style with images", () => {
    // Act
    const result = convertVariantData(
      {
        ...infoCards,
        variant: "cardsWithoutImages",
        cards: [{ title: "Card", url: "/card" }],
      },
      { variant: "cardsWithImages", cards: [] },
      infoCardsStyle(CARDS_WITH_IMAGES),
    )

    // Assert
    expect(result).toMatchObject({ cards: [{ title: "Card", url: "/card" }] })
  })

  it("keeps cards untrimmed when the branch has no card schema", () => {
    // Act
    const result = convertVariantData(
      infoCards,
      { variant: "cardsWithoutImages", cards: [] },
      { properties: { variant: {} } },
    )

    // Assert
    expect(result).toMatchObject({ cards: infoCards.cards })
  })

  it("falls back to the branch default when there are no cards yet", () => {
    // Act
    const result = convertVariantData(
      { type: "infocards" },
      { variant: "cardsWithoutImages", cards: [] },
      infoCardsStyle(CARDS_WITHOUT_IMAGES),
    )

    // Assert
    expect(result).toMatchObject({ cards: [] })
  })
})

describe("convertVariantData: other components", () => {
  it("merges the branch defaults over the previous data", () => {
    // Act
    const result = convertVariantData(
      { type: "image", src: "/a.png", size: "default" },
      { size: "smaller" },
      {},
    )

    // Assert
    expect(result).toEqual({ type: "image", src: "/a.png", size: "smaller" })
  })
})
