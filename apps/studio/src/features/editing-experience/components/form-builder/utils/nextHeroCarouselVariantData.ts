import type { JsonSchema } from "@jsonforms/core"
import {
  HERO_BLOCK_IMAGE_POSITION,
  HERO_CAROUSEL_LAYOUT,
  HERO_STYLE,
  HeroCarouselSlideSchema,
} from "@opengovsg/isomer-components"

import { defaultHeroCarouselSlide } from "./defaultHeroCarouselSlide"

// backgroundUrl is carried via defaultHeroCarouselSlide's fallback instead.
const CARRIED_SLIDE_FIELDS = Object.keys(
  HeroCarouselSlideSchema.properties,
).filter((key) => key !== "backgroundUrl")

type HeroData = Record<string, unknown> & {
  variant?: string
  backgroundUrl?: string
  slides?: Record<string, unknown>[]
}

const isCarousel = (data: HeroData) => data.variant === HERO_STYLE.carousel.key

// HeroGradientSchema is a Type.Intersect: its fields live under `allOf`/`oneOf`,
// not a top-level `properties`. Collect them all so switching into gradient
// doesn't drop the banner's data.
const flatSchemaPropertyKeys = (schema: JsonSchema): string[] => {
  if (schema.properties) return Object.keys(schema.properties)
  if (schema.allOf) return schema.allOf.flatMap(flatSchemaPropertyKeys)
  if (schema.oneOf) return schema.oneOf.flatMap(flatSchemaPropertyKeys)
  if (schema.anyOf) return schema.anyOf.flatMap(flatSchemaPropertyKeys)
  return []
}

/**
 * Data for a hero variant switch. Keeps only fields the selected branch
 * defines. Entering carousel seeds two slides from the previous hero; leaving
 * carousel lifts the first slide's content back to the root.
 */
export function nextHeroCarouselVariantData(
  previous: HeroData = {},
  next: HeroData,
  schema: JsonSchema,
) {
  const seeded = isCarousel(next)
    ? {
        ...next,
        carousel: {
          layout: HERO_CAROUSEL_LAYOUT.block,
          imagePosition: HERO_BLOCK_IMAGE_POSITION.right,
        },
        slides: [
          {
            ...defaultHeroCarouselSlide({
              backgroundUrl: previous.backgroundUrl,
            }),
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

  return Object.fromEntries(
    flatSchemaPropertyKeys(schema)
      .filter((key) => Object.hasOwn(source, key))
      .map((key) => [key, source[key]]),
  )
}
