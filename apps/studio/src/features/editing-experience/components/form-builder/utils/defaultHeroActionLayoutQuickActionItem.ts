import type { HeroActionLayoutQuickActionItem } from "@opengovsg/isomer-components"

// Required fields only. buttonLabel stays empty so the item shows a link icon.
export const createDefaultHeroActionLayoutQuickActionItem =
  (): HeroActionLayoutQuickActionItem => ({
    title: "Quick action title",
    description: "Add a short description for this link.",
    icon: "stars",
    buttonUrl: "/",
  })
