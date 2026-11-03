import type { HeroGradientProps } from "~/interfaces/complex/Hero"
import { HERO_GRADIENT_ACTION_LAYOUT } from "~/interfaces/complex/Hero"

import { HeroGradientButtons } from "./HeroGradientButtons"
import { HeroGradientQuickLinks } from "./HeroGradientQuickLinks"

export const HeroGradient = (props: HeroGradientProps) => {
  // TS narrows props.actions (not props) on the nested layout, so pass it back explicitly.
  switch (props.actions?.layout) {
    case HERO_GRADIENT_ACTION_LAYOUT.quickLinks:
      return <HeroGradientQuickLinks {...props} actions={props.actions} />
    case HERO_GRADIENT_ACTION_LAYOUT.buttons:
    // Existing gradient heroes omit actions and still render buttons.
    case undefined:
      return <HeroGradientButtons {...props} actions={props.actions} />
    default: {
      const _exhaustiveCheck: never = props.actions
      return _exhaustiveCheck
    }
  }
}
