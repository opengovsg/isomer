import { describe, expect, it } from "vitest"

import { HERO_STYLE, HeroSchema } from "../Hero"

const PLACEHOLDER_IMAGE = "/placeholder_no_image.png"
const PLACEHOLDER_TITLE = "Enter a title."

interface SchemaNode {
  anyOf?: SchemaNode[]
  properties?: Record<string, SchemaNode>
  items?: SchemaNode
  const?: string
  default?: unknown
}

function asSchema(value: unknown): SchemaNode {
  return value as SchemaNode
}

function carouselSchema() {
  const carousel = asSchema(HeroSchema).anyOf?.find(
    (branch) => branch.properties?.variant?.const === HERO_STYLE.carousel.key,
  )
  if (!carousel?.properties?.slides) {
    throw new Error("Carousel branch is missing")
  }

  return carousel
}

describe("HeroCarouselSchema defaults", () => {
  it("seeds two placeholder slides and does not default other hero images", () => {
    // Arrange
    const carousel = carouselSchema()
    const gradient = asSchema(HeroSchema).anyOf?.find(
      (branch) => branch.properties?.variant?.const === HERO_STYLE.gradient.key,
    )
    const slide = carousel.properties?.slides?.items
    const placeholderSlides = [
      { backgroundUrl: PLACEHOLDER_IMAGE, title: PLACEHOLDER_TITLE },
      { backgroundUrl: PLACEHOLDER_IMAGE, title: PLACEHOLDER_TITLE },
    ]

    // Act / Assert
    expect(carousel.properties?.slides?.default).toEqual(placeholderSlides)
    expect(slide?.properties?.backgroundUrl?.default).toBe(PLACEHOLDER_IMAGE)
    expect(slide?.properties?.title?.default).toBe(PLACEHOLDER_TITLE)
    expect(gradient?.properties?.backgroundUrl?.default).toBeUndefined()
    expect(gradient?.properties?.title?.default).toBeUndefined()
  })
})
