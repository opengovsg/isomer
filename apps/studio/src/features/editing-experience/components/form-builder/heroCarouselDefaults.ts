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

const CARRIED_SLIDE_FIELDS = [
  "title",
  "subtitle",
  "buttonLabel",
  "buttonUrl",
  "secondaryButtonLabel",
  "secondaryButtonUrl",
] as const

function carriedSlideFields(previous: Record<string, unknown>) {
  const carried: Record<string, unknown> = {}

  for (const key of CARRIED_SLIDE_FIELDS) {
    const value = previous[key]
    if (typeof value === "string" && value.length > 0) {
      carried[key] = value
    }
  }

  return carried
}

export function withHeroCarouselSlides<T>(previous: unknown, next: T): T {
  if (!isRecord(next) || next.variant !== HERO_STYLE.carousel.key) {
    return next
  }

  const previousRecord = isRecord(previous) ? previous : {}
  const previousImage = previousRecord.backgroundUrl

  return {
    ...next,
    slides: [
      {
        ...defaultHeroCarouselSlide(
          typeof previousImage === "string" ? previousImage : undefined,
        ),
        ...carriedSlideFields(previousRecord),
      },
      defaultHeroCarouselSlide(),
    ],
  }
}

function schemaPropertyKeys(schema: JsonSchema) {
  const keys: string[] = []
  const seen = new Set<string>()

  const visit = (node: JsonSchema | undefined) => {
    if (!node || typeof node !== "object") {
      return
    }

    if (node.properties) {
      for (const key of Object.keys(node.properties)) {
        if (seen.has(key)) {
          continue
        }
        seen.add(key)
        keys.push(key)
      }
    }

    for (const combinator of ["allOf", "anyOf", "oneOf"] as const) {
      const branches = node[combinator]
      if (!Array.isArray(branches)) {
        continue
      }
      for (const branch of branches) {
        visit(branch)
      }
    }
  }

  visit(schema)
  return keys
}

function hasOwn(value: Record<string, unknown>, key: string) {
  return Object.prototype.hasOwnProperty.call(value, key)
}

/** Keep fields the selected branch defines. Drop the rest, including carousel `slides` and `carousel`. */
export function nextVariantData(
  previous: unknown,
  next: unknown,
  schema: JsonSchema,
) {
  const seeded = withHeroCarouselSlides(previous, next)
  const previousRecord = isRecord(previous) ? previous : {}
  const nextRecord = isRecord(seeded) ? seeded : {}
  const leavingCarousel =
    previousRecord.variant === HERO_STYLE.carousel.key &&
    nextRecord.variant !== HERO_STYLE.carousel.key
  const firstSlide =
    leavingCarousel &&
    Array.isArray(previousRecord.slides) &&
    isRecord(previousRecord.slides[0])
      ? previousRecord.slides[0]
      : {}

  const merged: Record<string, unknown> = {}

  for (const key of schemaPropertyKeys(schema)) {
    if (hasOwn(nextRecord, key)) {
      merged[key] = nextRecord[key]
      continue
    }
    if (hasOwn(firstSlide, key)) {
      merged[key] = firstSlide[key]
      continue
    }
    if (hasOwn(previousRecord, key)) {
      merged[key] = previousRecord[key]
    }
  }

  return merged
}
