import { describe, expect, it } from "vitest"

import { PLACEHOLDER_IMAGE_FILENAME } from "../../constants"
import { defaultHeroCarouselSlide } from "../utils/defaultHeroCarouselSlide"
import { nextHeroCarouselVariantData } from "../utils/nextHeroCarouselVariantData"

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

describe("nextHeroCarouselVariantData", () => {
  it("keeps the previous hero image on the first slide and placeholders the second", () => {
    // Arrange
    const previous = {
      variant: "block",
      backgroundUrl: "/uploads/existing.png",
      title: "Keep me",
    }

    // Act
    const result = nextHeroCarouselVariantData(
      previous,
      { variant: "carousel" },
      carouselSchema,
    )

    // Assert
    expect(result).toEqual({
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
    const result = nextHeroCarouselVariantData(
      { variant: "block", title: "Hello" },
      { variant: "carousel" },
      carouselSchema,
    )

    // Assert
    expect(result).toEqual({
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
    const result = nextHeroCarouselVariantData(
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
    const result = nextHeroCarouselVariantData(
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
      carousel: { layout: "gradient" },
      slides: [{ backgroundUrl: "/stale.png" }],
    }

    // Act
    const result = nextHeroCarouselVariantData(
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
