import { describe, expect, it } from "vitest"

import {
  defaultHeroCarouselSlide,
  HERO_CAROUSEL_PLACEHOLDER_IMAGE,
  HERO_CAROUSEL_PLACEHOLDER_TITLE,
  isHeroCarouselSlideSchema,
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
    const next = { variant: "carousel", style: "block" }

    // Act
    const result = withHeroCarouselSlides(previous, next)

    // Assert
    expect(result).toEqual({
      variant: "carousel",
      style: "block",
      slides: [
        {
          backgroundUrl: "/uploads/existing.png",
          title: HERO_CAROUSEL_PLACEHOLDER_TITLE,
        },
        defaultHeroCarouselSlide(),
      ],
    })
  })

  it("uses the placeholder image when the previous hero has none", () => {
    // Arrange
    const next = { variant: "carousel", style: "block" }

    // Act
    const result = withHeroCarouselSlides(
      { variant: "block", title: "Hello" },
      next,
    )

    // Assert
    expect(result).toEqual({
      variant: "carousel",
      style: "block",
      slides: [defaultHeroCarouselSlide(), defaultHeroCarouselSlide()],
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
