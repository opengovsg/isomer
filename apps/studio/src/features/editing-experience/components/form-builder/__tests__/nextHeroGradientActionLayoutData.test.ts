import type { HeroGradientProps } from "@opengovsg/isomer-components"
import { HERO_GRADIENT_ACTION_LAYOUT } from "@opengovsg/isomer-components"

import { createDefaultHeroGradientQuickLinksItem } from "../utils/defaultHeroGradientQuickLinksItem"
import { nextHeroGradientActionLayoutData } from "../utils/nextHeroGradientActionLayoutData"

describe("nextHeroGradientActionLayoutData", () => {
  it("drops quick-link fields when switching to buttons", () => {
    // Arrange
    const current: Partial<HeroGradientProps> = {
      type: "hero",
      variant: "gradient",
      title: "Welcome",
      actions: {
        layout: "quickLinks",
        title: "Get started",
        showIcon: true,
        items: [createDefaultHeroGradientQuickLinksItem()],
      },
    }

    // Act
    const actual = nextHeroGradientActionLayoutData(
      current,
      HERO_GRADIENT_ACTION_LAYOUT.buttons,
    )

    // Assert
    expect(actual).toEqual({
      type: "hero",
      variant: "gradient",
      title: "Welcome",
      actions: { layout: "buttons" },
    })
  })

  it("drops button fields when switching to quick links", () => {
    // Arrange
    const current: Partial<HeroGradientProps> = {
      type: "hero",
      variant: "gradient",
      title: "Welcome",
      buttonLabel: "Apply",
      buttonUrl: "/apply",
    }

    // Act
    const actual = nextHeroGradientActionLayoutData(
      current,
      HERO_GRADIENT_ACTION_LAYOUT.quickLinks,
    )

    // Assert
    expect(actual).toEqual({
      type: "hero",
      variant: "gradient",
      title: "Welcome",
      actions: {
        layout: "quickLinks",
        title: "Get started",
        showIcon: true,
        items: [
          createDefaultHeroGradientQuickLinksItem(),
          createDefaultHeroGradientQuickLinksItem(),
        ],
      },
    })
  })
})
