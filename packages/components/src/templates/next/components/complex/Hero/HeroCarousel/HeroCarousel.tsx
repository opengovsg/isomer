import type { HeroCarouselProps } from "~/interfaces/complex/Hero"
import {
  HERO_CAROUSEL_SLIDE_LIMITS,
  HERO_CAROUSEL_STYLE,
} from "~/interfaces/complex/Hero"
import { getHeadingTag } from "~/utils/getHeadingTag"
import { getReferenceLinkHref } from "~/utils/getReferenceLinkHref"

import { HeroCarouselClient } from "./HeroCarouselClient"

export const HeroCarousel = ({
  site,
  slides,
  style,
  headingLevel,
}: HeroCarouselProps) => {
  if (slides.length < HERO_CAROUSEL_SLIDE_LIMITS.minItems) {
    return null
  }

  return (
    <HeroCarouselClient
      isBlock={style === HERO_CAROUSEL_STYLE.block}
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
}
