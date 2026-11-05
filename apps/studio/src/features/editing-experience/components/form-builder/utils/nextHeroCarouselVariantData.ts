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

// Type.Composite flattens into a plain `properties` map, but Type.Intersect
// (used by HeroGradientSchema, to validate its oneOf action-layout member)
// only exposes its members via `allOf` -- `schema.properties` is undefined
// there. Walk `allOf` recursively so gradient's keys aren't silently dropped,
// which otherwise made every switch INTO gradient wipe the banner's data.
// Also union in `oneOf`/`anyOf` branches (gradient's buttons-vs-quick-links
// layout choice) so CallToActionsSchema's button fields -- present on every
// other Hero variant -- survive a round trip through gradient. Quick-links'
// own fields (items/title/showIcon, gradient-only) are still lost on the hop
// OUT of gradient to a variant that doesn't carry them at all; no amount of
// recursion here can restore data that already isn't in `source` by the time
// this runs, so that loss is accepted rather than worked around.
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
