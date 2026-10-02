import type { HeroCarouselProps } from "~/interfaces/complex/Hero"
import { isExternalUrl } from "~/utils/isExternalUrl"

import { HeroCarouselClient } from "./HeroCarouselClient"

const resolveBackgroundUrl = (
  backgroundUrl: string,
  assetsBaseUrl: HeroCarouselProps["site"]["assetsBaseUrl"],
) => {
  if (isExternalUrl(backgroundUrl) || assetsBaseUrl === undefined) {
    return backgroundUrl
  }

  return `${assetsBaseUrl}${backgroundUrl}`
}

export const HeroCarousel = (props: HeroCarouselProps) => {
  const { site, slides, ...rest } = props

  const processedSlides = slides.map((slide) => ({
    ...slide,
    backgroundUrl: resolveBackgroundUrl(slide.backgroundUrl, site.assetsBaseUrl),
  }))

  return (
    <HeroCarouselClient site={site} slides={processedSlides} {...rest} />
  )
}
