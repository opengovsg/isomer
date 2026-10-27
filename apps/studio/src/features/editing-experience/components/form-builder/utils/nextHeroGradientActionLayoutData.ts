import type {
  HeroGradientActionLayout,
  HeroGradientButtonsProps,
  HeroGradientProps,
} from "@opengovsg/isomer-components"
import {
  HERO_GRADIENT_ACTION_LAYOUT,
  HERO_QUICK_LINKS_LIMITS,
} from "@opengovsg/isomer-components"
import { omit } from "lodash-es"

import { createDefaultHeroGradientQuickLinksItem } from "./defaultHeroGradientQuickLinksItem"

const HERO_QUICK_LINKS_DEFAULT_TITLE = "Get started"

// Button fields live at the hero root (shared with the other hero styles).
const BUTTON_FIELDS = [
  "buttonLabel",
  "buttonUrl",
  "secondaryButtonLabel",
  "secondaryButtonUrl",
] as const satisfies (keyof HeroGradientButtonsProps)[]

// Record keyed by layout: adding a layout fails to compile until it has defaults here.
const DEFAULT_ACTIONS: Record<
  HeroGradientActionLayout,
  () => NonNullable<HeroGradientProps["actions"]>
> = {
  [HERO_GRADIENT_ACTION_LAYOUT.buttons]: () => ({
    layout: HERO_GRADIENT_ACTION_LAYOUT.buttons,
  }),
  [HERO_GRADIENT_ACTION_LAYOUT.quickLinks]: () => ({
    layout: HERO_GRADIENT_ACTION_LAYOUT.quickLinks,
    title: HERO_QUICK_LINKS_DEFAULT_TITLE,
    showIcon: true,
    items: Array.from({ length: HERO_QUICK_LINKS_LIMITS.minItems }, () =>
      createDefaultHeroGradientQuickLinksItem(),
    ),
  }),
}

/** Keep shared hero fields. Replace actions and drop root button fields when leaving buttons. */
export const nextHeroGradientActionLayoutData = (
  current: Partial<HeroGradientProps> | undefined,
  layout: HeroGradientActionLayout,
) => ({
  ...(layout === HERO_GRADIENT_ACTION_LAYOUT.buttons
    ? current
    : omit(current, BUTTON_FIELDS)),
  actions: DEFAULT_ACTIONS[layout](),
})
