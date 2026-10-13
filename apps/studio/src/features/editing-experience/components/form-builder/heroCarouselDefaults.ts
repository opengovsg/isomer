import type { JsonSchema } from "@jsonforms/core"
import { HERO_STYLE } from "@opengovsg/isomer-components"

import { PLACEHOLDER_IMAGE_FILENAME } from "../constants"

export const HERO_CAROUSEL_PLACEHOLDER_IMAGE = `/${PLACEHOLDER_IMAGE_FILENAME}`
export const HERO_CAROUSEL_PLACEHOLDER_TITLE = "Enter a title."

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export function defaultHeroCarouselSlide(backgroundUrl?: string) {
  return {
    backgroundUrl:
      backgroundUrl && backgroundUrl.length > 0
        ? backgroundUrl
        : HERO_CAROUSEL_PLACEHOLDER_IMAGE,
    title: HERO_CAROUSEL_PLACEHOLDER_TITLE,
  }
}

export function withHeroCarouselSlides<T>(previous: unknown, next: T): T {
  if (!isRecord(next) || next.variant !== HERO_STYLE.carousel.key) {
    return next
  }

  const previousImage = isRecord(previous) ? previous.backgroundUrl : undefined

  return {
    ...next,
    slides: [
      defaultHeroCarouselSlide(
        typeof previousImage === "string" ? previousImage : undefined,
      ),
      defaultHeroCarouselSlide(),
    ],
  }
}

export function isHeroCarouselSlideSchema(schema: JsonSchema) {
  return (
    schema.title === "Slide" &&
    schema.properties?.backgroundUrl?.format === "image"
  )
}
