export const HERO_STYLE = {
  gradient: { key: "gradient", title: "Gradient (Default)" },
  block: { key: "block", title: "Block" },
  largeImage: { key: "largeImage", title: "Large image" },
  floating: { key: "floating", title: "Floating" },
  searchbar: { key: "searchbar", title: "Search bar" },
  carousel: { key: "carousel", title: "Carousel" },
} as const

export const HERO_CAROUSEL_LAYOUT = {
  block: "block",
  gradient: "gradient",
} as const

export type HeroCarouselLayout =
  (typeof HERO_CAROUSEL_LAYOUT)[keyof typeof HERO_CAROUSEL_LAYOUT]

export const HERO_CAROUSEL_CONTENT_ALIGNMENT = {
  left: "left",
  center: "center",
} as const

export type HeroCarouselContentAlignment =
  (typeof HERO_CAROUSEL_CONTENT_ALIGNMENT)[keyof typeof HERO_CAROUSEL_CONTENT_ALIGNMENT]

export const HERO_GRADIENT_ACTION_LAYOUT = {
  buttons: "buttons",
  quickLinks: "quickLinks",
} as const

export type HeroGradientActionLayout =
  (typeof HERO_GRADIENT_ACTION_LAYOUT)[keyof typeof HERO_GRADIENT_ACTION_LAYOUT]

export const HERO_QUICK_LINKS_LIMITS = {
  minItems: 2,
  maxItems: 4,
} as const

export const HERO_BLOCK_IMAGE_POSITION = {
  left: "left",
  right: "right",
} as const

export type HeroCarouselImagePosition =
  (typeof HERO_BLOCK_IMAGE_POSITION)[keyof typeof HERO_BLOCK_IMAGE_POSITION]

export const HERO_BLOCK_IMAGE_EDGE = {
  straight: "straight",
  curved: "curved",
} as const

export type HeroStyleVariant =
  (typeof HERO_STYLE)[keyof typeof HERO_STYLE]["key"]

export const HERO_CAROUSEL_SLIDE_LIMITS = {
  minItems: 2,
  maxItems: 4,
} as const

export function getHeroStyleVariantForBranchTitle(
  branchTitle: string,
): HeroStyleVariant | undefined {
  return Object.values(HERO_STYLE).find(
    (branch) => branch.title === branchTitle,
  )?.key
}
