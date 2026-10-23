import type { HeroCarouselProps } from "~/interfaces/complex/Hero"
import {
  HERO_CAROUSEL_LAYOUT,
  HERO_CAROUSEL_SLIDE_LIMITS,
} from "~/interfaces/complex/Hero"
import { getHeadingTag } from "~/utils/getHeadingTag"
import { getReferenceLinkHref } from "~/utils/getReferenceLinkHref"

import { HeroCarouselBlockClient } from "./HeroCarouselBlockClient"
import { HeroCarouselGradientClient } from "./HeroCarouselGradientClient"

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

  const headingTag = getHeadingTag(headingLevel)
  const inactiveHeadingTag = getHeadingTag(headingLevel + 1)

  const slideViews = slides.map((slide) => ({
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
  }))

  switch (carousel.layout) {
    case HERO_CAROUSEL_LAYOUT.block:
      return (
        <HeroCarouselBlockClient
          headingTag={headingTag}
          inactiveHeadingTag={inactiveHeadingTag}
          assetsBaseUrl={site.assetsBaseUrl}
          slides={slideViews}
          imagePosition={carousel.imagePosition}
        />
      )
    case HERO_CAROUSEL_LAYOUT.gradient:
      return (
        <HeroCarouselGradientClient
          headingTag={headingTag}
          inactiveHeadingTag={inactiveHeadingTag}
          assetsBaseUrl={site.assetsBaseUrl}
          slides={slideViews}
          contentAlignment={carousel.contentAlignment}
        />
      )
    default: {
      const _exhaustiveCheck: never = carousel
      return null
    }
  }
}
