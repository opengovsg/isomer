import type { HeroActionLayoutQuickActionItem } from "@opengovsg/isomer-components"
import { HERO_QUICK_ACTION_ITEM_TITLE_PLACEHOLDER } from "@opengovsg/isomer-components"

export const HERO_QUICK_ACTIONS_MIN_ITEMS = 2

/** Default panel heading when switching to the quick-actions layout. */
export const HERO_QUICK_ACTIONS_DEFAULT_TITLE = "Get started"

export const createDefaultHeroActionLayoutQuickActionItem =
  (): HeroActionLayoutQuickActionItem => ({
    title: HERO_QUICK_ACTION_ITEM_TITLE_PLACEHOLDER,
    description: "Add a short description for this link.",
    icon: "stars",
    buttonLabel: "Learn more",
    buttonUrl: "/",
  })
