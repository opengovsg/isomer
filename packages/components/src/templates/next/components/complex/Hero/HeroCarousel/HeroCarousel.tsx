import type { HeroCarouselProps } from "~/interfaces/complex/Hero"
import {
  HERO_CAROUSEL_LAYOUT,
  HERO_CAROUSEL_SLIDE_LIMITS,
} from "~/interfaces/complex/Hero"
import { getHeadingTag } from "~/utils/getHeadingTag"
import { getReferenceLinkHref } from "~/utils/getReferenceLinkHref"

import { HeroCarouselClient } from "./HeroCarouselClient"

export const HeroCarousel = ({
  site,
  slides,
  carousel,
  headingLevel,
}: HeroCarouselProps) => {
  // defensively prevent rendering with too few slides
  if (slides.length < HERO_CAROUSEL_SLIDE_LIMITS.minItems) {
    return null
  }

  const layout = carousel?.layout

  switch (layout) {
    case HERO_CAROUSEL_LAYOUT.block:
    case HERO_CAROUSEL_LAYOUT.gradient:
      return (
        <HeroCarouselClient
          layout={layout}
          headingTag={getHeadingTag(headingLevel)}
          assetsBaseUrl={site.assetsBaseUrl}
          slides={slides.map((slide) => ({
            backgroundUrl: slide.backgroundUrl,
            title: slide.title,
            subtitle: slide.subtitle,
            primaryLabel: slide.buttonLabel,
            primaryHref: getReferenceLinkHref(
              slide.buttonUrl,
              site.siteMapArray,
              site.assetsBaseUrl,
            ),
            secondaryLabel: slide.secondaryButtonLabel,
            secondaryHref: getReferenceLinkHref(
              slide.secondaryButtonUrl,
              site.siteMapArray,
              site.assetsBaseUrl,
            ),
          }))}
        />
      )
    default: {
      const _exhaustiveCheck: never = layout
      return null
    }
  }
}
