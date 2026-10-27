import type { HeroGradientQuickLinksItem } from "@opengovsg/isomer-components"

// Required fields only. buttonLabel stays empty so the item shows a link icon.
export const createDefaultHeroGradientQuickLinksItem =
  (): HeroGradientQuickLinksItem => ({
    title: "Quick link title",
    description: "Add a short description for this link.",
    icon: "stars",
    buttonUrl: "/",
  })
