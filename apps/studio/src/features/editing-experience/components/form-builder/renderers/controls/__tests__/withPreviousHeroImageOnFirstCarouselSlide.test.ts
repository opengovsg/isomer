import { describe, expect, it } from "vitest"

import { withPreviousHeroImageOnFirstCarouselSlide } from "../JsonFormsCombinatorControl"

const placeholderSlides = [
  {
    backgroundUrl: "/placeholder_no_image.png",
    title: "Enter a title.",
  },
  {
    backgroundUrl: "/placeholder_no_image.png",
    title: "Enter a title.",
  },
]

describe("withPreviousHeroImageOnFirstCarouselSlide", () => {
  it("copies the previous hero image onto the first slide", () => {
    // Arrange
    const previous = {
      variant: "block",
      backgroundUrl: "/uploads/existing.png",
      title: "Keep me",
    }
    const next = {
      variant: "carousel",
      style: "block",
      slides: placeholderSlides,
    }

    // Act
    const result = withPreviousHeroImageOnFirstCarouselSlide(previous, next)

    // Assert
    expect(result).toEqual({
      variant: "carousel",
      style: "block",
      slides: [
        {
          backgroundUrl: "/uploads/existing.png",
          title: "Enter a title.",
        },
        placeholderSlides[1],
      ],
    })
    expect(placeholderSlides[0]?.backgroundUrl).toBe(
      "/placeholder_no_image.png",
    )
  })

  it("leaves placeholder slides when the previous hero has no image", () => {
    // Arrange
    const next = { variant: "carousel", slides: placeholderSlides }

    // Act
    const result = withPreviousHeroImageOnFirstCarouselSlide(
      { variant: "block", title: "Hello" },
      next,
    )

    // Assert
    expect(result).toBe(next)
  })

  it("does not rewrite other variants", () => {
    // Arrange
    const next = {
      variant: "gradient",
      backgroundUrl: "/placeholder_no_image.png",
    }

    // Act
    const result = withPreviousHeroImageOnFirstCarouselSlide(
      { backgroundUrl: "/uploads/existing.png" },
      next,
    )

    // Assert
    expect(result).toBe(next)
  })
})
