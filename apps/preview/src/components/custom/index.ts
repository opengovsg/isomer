import type { ComponentType } from "react"

export { default as HeroCollage } from "./HeroCollage"
export { default as HeroBlobSaaS } from "./HeroBlobSaaS"
export { default as TableStyled } from "./TableStyled"
export { default as CardsCarousel } from "./CardsCarousel"
export { default as ArticleLayoutAlt } from "./ArticleLayoutAlt"
export { default as ContentLayoutAlt } from "./ContentLayoutAlt"
export { default as EventLayout } from "./EventLayout"
export { default as TextWithImage } from "./TextWithImage"
export { default as CalloutVariants } from "./CalloutVariants"
export { default as Footnotes } from "./Footnotes"
export { default as LinkHubHome } from "./LinkHubHome"
export { default as LinkHubContent } from "./LinkHubContent"
export { default as ListsWithIndentation } from "./ListsWithIndentation"

/** Which page each block belongs to */
export const CUSTOM_BLOCK_PAGE: Record<string, "home" | "content" | "article"> =
  {
    "hero-collage": "home",
    "hero-blob-saas": "home",
    "table-styled": "content",
    "cards-carousel": "home",
    "text-with-image": "content",
    "callout-variants": "content",
    "footnotes": "article",
    "link-hub-home": "home",
    "link-hub-content": "content",
    "lists-with-indentation": "article",
  }

/** Human-readable labels */
export const CUSTOM_BLOCK_LABEL: Record<string, string> = {
  "hero-collage": "Hero — Image Collage",
  "hero-blob-saas": "Hero — Blob + SaaS",
  "table-styled": "Table — Styled",
  "cards-carousel": "Cards — Carousel",
  "text-with-image": "Text with Image",
  "callout-variants": "Callout Variants",
  "footnotes": "Footnotes",
  "link-hub-home": "Link Hub",
  "link-hub-content": "Link Hub",
  "lists-with-indentation": "Lists with Indentation",
}

/** Whether a block ID is a hero variant (replaces rather than appends) */
export const CUSTOM_BLOCK_IS_HERO: Record<string, boolean> = {
  "hero-collage": true,
  "hero-blob-saas": true,
}

export const CUSTOM_BLOCK_REGISTRY: Record<string, ComponentType> = {}
