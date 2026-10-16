import { describe, expect, it } from "vitest"

import {
  defaultHeroCarouselSlide,
  HERO_CAROUSEL_PLACEHOLDER_IMAGE,
  isHeroCarouselSlideSchema,
  nextVariantData,
  withHeroCarouselSlides,
} from "../heroCarouselDefaults"

describe("withHeroCarouselSlides", () => {
  it("keeps the previous hero image on the first slide and placeholders the second", () => {
    // Arrange
    const previous = {
      variant: "block",
      backgroundUrl: "/uploads/existing.png",
      title: "Keep me",
    }
    const next = { variant: "carousel", layout: "block" }

    // Act
    const result = withHeroCarouselSlides(previous, next)

    // Assert
    expect(result).toEqual({
      variant: "carousel",
      layout: "block",
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
    // Arrange
    const next = { variant: "carousel", layout: "block" }

    // Act
    const result = withHeroCarouselSlides(
      { variant: "block", title: "Hello" },
      next,
    )

    // Assert
    expect(result).toEqual({
      variant: "carousel",
      layout: "block",
      slides: [
        { ...defaultHeroCarouselSlide(), title: "Hello" },
        defaultHeroCarouselSlide(),
      ],
    })
    expect(defaultHeroCarouselSlide().backgroundUrl).toBe(
      HERO_CAROUSEL_PLACEHOLDER_IMAGE,
    )
  })

  it("does not rewrite other variants", () => {
    // Arrange
    const next = { variant: "gradient", backgroundUrl: "/uploads/existing.png" }

    // Act
    const result = withHeroCarouselSlides(
      { backgroundUrl: "/uploads/other.png" },
      next,
    )

    // Assert
    expect(result).toBe(next)
  })
})

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
    layout: {},
    slides: {},
  },
}

describe("nextVariantData", () => {
  it("drops slides and layout when leaving carousel and keeps the first slide content", () => {
    // Arrange
    const previous = {
      type: "hero",
      variant: "carousel",
      layout: "gradient",
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
    const result = nextVariantData(
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

  it("drops root hero fields when entering carousel", () => {
    // Arrange
    const previous = {
      type: "hero",
      variant: "block",
      backgroundUrl: "/uploads/existing.png",
      title: "Hello",
      subtitle: "More",
      layout: "gradient",
      slides: [{ backgroundUrl: "/stale.png" }],
    }

    // Act
    const result = nextVariantData(
      previous,
      { type: "hero", variant: "carousel", layout: "block" },
      carouselSchema,
    )

    // Assert
    expect(result).toEqual({
      type: "hero",
      variant: "carousel",
      layout: "block",
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

describe("isHeroCarouselSlideSchema", () => {
  it("matches a carousel slide and ignores other item schemas", () => {
    // Arrange / Act / Assert
    expect(
      isHeroCarouselSlideSchema({
        title: "Slide",
        properties: { backgroundUrl: { format: "image" } },
      }),
    ).toBe(true)
    expect(
      isHeroCarouselSlideSchema({
        title: "Card",
        properties: { backgroundUrl: { format: "image" } },
      }),
    ).toBe(false)
  })
})
