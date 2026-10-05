import type { HeroProps } from "~/interfaces/complex/Hero"

import { HeroBlock } from "./HeroBlock"
import { HeroFloating } from "./HeroFloating"
import { HeroGradient } from "./HeroGradient"
import { HeroLargeImage } from "./HeroLargeImage"
import { HeroSearchbar } from "./HeroSearchbar"

export const Hero = (props: HeroProps) => {
  const { variant } = props
  switch (variant) {
    case "gradient":
      return <HeroGradient {...props} />
    case "block":
      return <HeroBlock {...props} />
    case "largeImage":
      return <HeroLargeImage {...props} />
    case "floating":
      return <HeroFloating {...props} />
    case "searchbar":
      return <HeroSearchbar {...props} />
    default:
      const _exhaustiveCheck: never = variant
      return null
  }
}
