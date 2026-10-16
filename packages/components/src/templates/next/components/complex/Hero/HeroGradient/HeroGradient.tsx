import type { HeroGradientProps } from "~/interfaces/complex/Hero"
import { HERO_ACTION_LAYOUT } from "~/interfaces/complex/Hero"

import { HeroGradientButtons } from "./HeroGradientButtons"
import { HeroGradientQuickActions } from "./HeroGradientQuickActions"

export const HeroGradient = (props: HeroGradientProps) => {
  switch (props.actionLayout) {
    case HERO_ACTION_LAYOUT.quickActions:
      return <HeroGradientQuickActions {...props} />
    case HERO_ACTION_LAYOUT.buttons:
    // Existing gradient heroes omit actionLayout and still render buttons.
    case undefined:
      return <HeroGradientButtons {...props} />
    default: {
      const _exhaustiveCheck: never = props
      return _exhaustiveCheck
    }
  }
}
