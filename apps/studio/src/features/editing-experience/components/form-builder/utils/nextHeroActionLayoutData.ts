import type {
  HeroActionLayout,
  HeroGradientButtonsProps,
  HeroGradientProps,
  HeroGradientQuickActionsProps,
} from "@opengovsg/isomer-components"
import {
  HERO_ACTION_LAYOUT,
  HERO_QUICK_ACTIONS_LIMITS,
} from "@opengovsg/isomer-components"
import { omit } from "lodash-es"

import { createDefaultHeroActionLayoutQuickActionItem } from "./defaultHeroActionLayoutQuickActionItem"

const HERO_QUICK_ACTIONS_DEFAULT_TITLE = "Get started"

// Fields owned by each layout. Dropped when switching to the other layout.
const LAYOUT_FIELDS = {
  [HERO_ACTION_LAYOUT.buttons]: [
    "buttonLabel",
    "buttonUrl",
    "secondaryButtonLabel",
    "secondaryButtonUrl",
  ],
  [HERO_ACTION_LAYOUT.quickActions]: [
    "quickActionsTitle",
    "showIcon",
    "quickActionsItems",
  ],
} as const satisfies {
  buttons: (keyof HeroGradientButtonsProps)[]
  quickActions: (keyof HeroGradientQuickActionsProps)[]
}

const defaultQuickActionsFields = () => ({
  quickActionsTitle: HERO_QUICK_ACTIONS_DEFAULT_TITLE,
  showIcon: true,
  quickActionsItems: Array.from(
    { length: HERO_QUICK_ACTIONS_LIMITS.minItems },
    () => createDefaultHeroActionLayoutQuickActionItem(),
  ),
})

/** Keep shared hero fields. Drop the layout that was not selected. */
export const nextHeroActionLayoutData = (
  current: Partial<HeroGradientProps> | undefined,
  layout: HeroActionLayout,
) => {
  const otherLayout =
    layout === HERO_ACTION_LAYOUT.buttons
      ? HERO_ACTION_LAYOUT.quickActions
      : HERO_ACTION_LAYOUT.buttons

  return {
    ...omit(current, LAYOUT_FIELDS[otherLayout]),
    actionLayout: layout,
    ...(layout === HERO_ACTION_LAYOUT.quickActions
      ? defaultQuickActionsFields()
      : {}),
  }
}
