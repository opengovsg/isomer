import type { HeroGradientQuickLinksItem } from "@opengovsg/isomer-components"

// Required fields only. The title always shows a link icon.
export const createDefaultHeroGradientQuickLinksItem =
  (): HeroGradientQuickLinksItem => ({
    title: "Quick link title",
    description: "Add a short description for this link.",
    icon: "stars",
    buttonUrl: "/",
  })
