import type { HeroProps } from "~/interfaces/complex/Hero"
import { HERO_STYLE } from "~/interfaces/complex/Hero"

import { type ContentBlockIndexProps } from "../../../render/contentBlockIndex"
import { HeroBlock } from "./HeroBlock"
import { HeroFloating } from "./HeroFloating"
import { HeroGradient } from "./HeroGradient"
import { HeroLargeImage } from "./HeroLargeImage"
import { HeroSearchbar } from "./HeroSearchbar"

type HeroRenderProps = HeroProps & ContentBlockIndexProps

export const Hero = (props: HeroRenderProps) => {
  const { variant } = props
  switch (variant) {
    case HERO_STYLE.gradient:
      return <HeroGradient {...props} />
    case HERO_STYLE.block:
      return <HeroBlock {...props} />
    case HERO_STYLE.largeImage:
      return <HeroLargeImage {...props} />
    case HERO_STYLE.floating:
      return <HeroFloating {...props} />
    case HERO_STYLE.searchbar:
      return <HeroSearchbar {...props} />
    default:
      const _exhaustiveCheck: never = variant
      return null
  }
}
