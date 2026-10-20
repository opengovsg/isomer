import type { HeroProps } from "~/interfaces/complex/Hero"
import { HERO_STYLE } from "~/interfaces/complex/Hero"

import { HeroBlock } from "./HeroBlock"
import { HeroFloating } from "./HeroFloating"
import { HeroGradient } from "./HeroGradient"
import { HeroLargeImage } from "./HeroLargeImage"
import { HeroSearchbar } from "./HeroSearchbar"

export const Hero = (props: HeroProps) => {
  const { variant } = props
  switch (variant) {
    case HERO_STYLE.gradient.key:
      return <HeroGradient {...props} />
    case HERO_STYLE.block.key:
      return <HeroBlock {...props} />
    case HERO_STYLE.largeImage.key:
      return <HeroLargeImage {...props} />
    case HERO_STYLE.floating.key:
      return <HeroFloating {...props} />
    case HERO_STYLE.searchbar.key:
      return <HeroSearchbar {...props} />
    default:
      const _exhaustiveCheck: never = variant
      return null
  }
}
