import type { JsonSchema } from "@jsonforms/core"
import { HERO_CAROUSEL_LAYOUT, HERO_STYLE } from "@opengovsg/isomer-components"

import { PLACEHOLDER_IMAGE_FILENAME } from "../constants"

export const HERO_CAROUSEL_PLACEHOLDER_IMAGE = `/${PLACEHOLDER_IMAGE_FILENAME}`
export const HERO_CAROUSEL_PLACEHOLDER_TITLE = "Enter a title."

export function defaultHeroCarouselSlide(backgroundUrl?: string) {
  return {
    backgroundUrl: backgroundUrl || HERO_CAROUSEL_PLACEHOLDER_IMAGE,
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

type HeroData = Record<string, unknown> & {
  variant?: string
  backgroundUrl?: string
  slides?: Record<string, unknown>[]
}

const isCarousel = (data: HeroData) => data.variant === HERO_STYLE.carousel.key

/**
 * Data for a hero variant switch. Keeps only fields the selected branch
 * defines. Entering carousel seeds two slides from the previous hero; leaving
 * carousel lifts the first slide's content back to the root.
 */
export function nextVariantData(
  previous: HeroData = {},
  next: HeroData,
  schema: JsonSchema,
) {
  const seeded = isCarousel(next)
    ? {
        ...next,
        carousel: { layout: HERO_CAROUSEL_LAYOUT.block },
        slides: [
          {
            ...defaultHeroCarouselSlide(previous.backgroundUrl),
            ...Object.fromEntries(
              CARRIED_SLIDE_FIELDS.filter((key) => previous[key]).map((key) => [
                key,
                previous[key],
              ]),
            ),
          },
          defaultHeroCarouselSlide(),
        ],
      }
    : next
  const firstSlide = isCarousel(previous) ? previous.slides?.[0] : undefined
  const source: Record<string, unknown> = {
    ...previous,
    ...firstSlide,
    ...seeded,
  }

  // Hero branches are flat objects (Type.Composite / Type.Object).
  return Object.fromEntries(
    Object.keys(schema.properties ?? {})
      .filter((key) => Object.hasOwn(source, key))
      .map((key) => [key, source[key]]),
  )
}
