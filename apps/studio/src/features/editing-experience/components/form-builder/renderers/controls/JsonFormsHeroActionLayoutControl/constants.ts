import type { HeroActionLayoutQuickActionItem } from "@opengovsg/isomer-components"

export const HERO_QUICK_ACTIONS_MIN_ITEMS = 2

/** Default panel heading when switching to the quick-actions layout. */
export const HERO_QUICK_ACTIONS_DEFAULT_TITLE = "Get started"

// Required fields only; buttonLabel stays empty so the item shows a link icon.
export const createDefaultHeroActionLayoutQuickActionItem =
  (): HeroActionLayoutQuickActionItem => ({
    title: "Quick action title",
    description: "Add a short description for this link.",
    icon: "stars",
    buttonUrl: "/",
  })
