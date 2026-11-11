import { pick, pickBy } from "lodash-es"
import { PLACEHOLDER_IMAGE_FILENAME } from "~/constants"
import {
  HERO_BLOCK_IMAGE_POSITION,
  HERO_CAROUSEL_LAYOUT,
  HERO_STYLE,
  HeroCarouselSlideSchema,
} from "~/interfaces/complex/Hero"

type VariantData = Record<string, unknown>

// The subset of JSON Schema needed to read the selected branch's fields.
interface VariantSchema {
  properties?: Record<string, VariantSchema>
  items?: VariantSchema | VariantSchema[]
  allOf?: VariantSchema[]
  oneOf?: VariantSchema[]
  anyOf?: VariantSchema[]
}

type VariantConverter = (
  previous: VariantData,
  defaults: VariantData,
  schema: VariantSchema,
) => VariantData

// A union spanning the whole block (hero) keeps only the branch's fields.
// One spanning part of it (infocards) must merge, or block fields are lost.
const VARIANT_CONVERTERS: Partial<Record<string, VariantConverter>> = {
  hero: convertHeroVariantData,
  infocards: convertInfoCardsVariantData,
}

/**
 * Data for a variant switch. `defaults` holds the selected branch's defaults
 * and `schema` is that branch. Components without a converter merge `defaults`
 * over `previous`.
 */
export function convertVariantData(
  previous: VariantData = {},
  defaults: VariantData,
  schema: VariantSchema,
): VariantData {
  // Assumes only block-level variant pickers call this. Hero branches define
  // `type`; infocards branches don't, so fall back to the block's.
  const convert = VARIANT_CONVERTERS[String(defaults.type ?? previous.type)]

  if (!convert) {
    return { ...previous, ...defaults }
  }

  return convert(previous, defaults, schema)
}

type HeroData = VariantData & {
  variant?: string
  backgroundUrl?: string
  slides?: VariantData[]
}

// backgroundUrl is carried via defaultHeroCarouselSlide's fallback instead.
const CARRIED_SLIDE_FIELDS = Object.keys(
  HeroCarouselSlideSchema.properties,
).filter((key) => key !== "backgroundUrl")

export function defaultHeroCarouselSlide({
  backgroundUrl,
}: { backgroundUrl?: string } = {}) {
  return {
    backgroundUrl: backgroundUrl || `/${PLACEHOLDER_IMAGE_FILENAME}`,
    title: "Enter a title.",
  }
}

const isCarousel = (data: HeroData) => data.variant === HERO_STYLE.carousel.key

const slideFromHero = (hero: HeroData) => ({
  ...defaultHeroCarouselSlide({ backgroundUrl: hero.backgroundUrl }),
  ...pickBy(pick(hero, CARRIED_SLIDE_FIELDS), Boolean),
})

/**
 * Keeps only fields the selected branch defines. Entering carousel seeds two
 * slides from the previous hero; leaving carousel lifts the first slide's
 * content back to the root.
 */
function convertHeroVariantData(
  previous: HeroData,
  defaults: HeroData,
  schema: VariantSchema,
) {
  const seeded = isCarousel(defaults)
    ? {
        ...defaults,
        carousel: {
          layout: HERO_CAROUSEL_LAYOUT.block,
          imagePosition: HERO_BLOCK_IMAGE_POSITION.right,
        },
        slides: [slideFromHero(previous), defaultHeroCarouselSlide()],
      }
    : defaults
  const firstSlide = isCarousel(previous) ? previous.slides?.[0] : undefined

  // Later spreads win: branch defaults > first slide > stale root fields.
  const source: VariantData = { ...previous, ...firstSlide, ...seeded }

  return pick(source, flatSchemaPropertyKeys(schema))
}

type InfoCardsData = VariantData & { cards?: VariantData[] }

/**
 * The style branch defaults `cards` to `[]`, which would wipe every card; keep
 * them, trimmed to the fields the selected style's card defines.
 */
function convertInfoCardsVariantData(
  previous: InfoCardsData,
  defaults: InfoCardsData,
  schema: VariantSchema,
) {
  const merged = { ...previous, ...defaults }

  if (!previous.cards) {
    return merged
  }

  const cardSchema = schema.properties?.cards?.items

  if (!cardSchema || Array.isArray(cardSchema)) {
    return { ...merged, cards: previous.cards }
  }

  const cardKeys = flatSchemaPropertyKeys(cardSchema)

  return {
    ...merged,
    cards: previous.cards.map((card) => pick(card, cardKeys)),
  }
}

// Branch schemas may be Type.Intersect (e.g. HeroGradientSchema), whose fields
// live under `allOf`/`oneOf` rather than a top-level `properties`.
function flatSchemaPropertyKeys(schema: VariantSchema): string[] {
  if (schema.properties) {
    return Object.keys(schema.properties)
  }
  if (schema.allOf) {
    return schema.allOf.flatMap(flatSchemaPropertyKeys)
  }
  if (schema.oneOf) {
    return schema.oneOf.flatMap(flatSchemaPropertyKeys)
  }
  if (schema.anyOf) {
    return schema.anyOf.flatMap(flatSchemaPropertyKeys)
  }
  return []
}
