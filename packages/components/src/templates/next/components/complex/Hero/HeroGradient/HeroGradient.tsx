import type { HeroGradientProps } from "~/interfaces/complex/Hero"
import { HERO_ACTION_LAYOUT } from "~/interfaces/complex/Hero"

import { HeroGradientButtons } from "./HeroGradientButtons"
import { HeroGradientQuickActions } from "./HeroGradientQuickActions"

export const HeroGradient = (props: HeroGradientProps) => {
  if (props.actionLayout === HERO_ACTION_LAYOUT.quickActions) {
    return <HeroGradientQuickActions {...props} />
  }

  // For backwards compatibility with existing gradient hero without layout value
  return <HeroGradientButtons {...props} />
}
