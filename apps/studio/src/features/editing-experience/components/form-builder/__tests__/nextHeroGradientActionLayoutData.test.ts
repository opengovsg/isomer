import type { HeroGradientProps } from "@opengovsg/isomer-components"
import { HERO_GRADIENT_ACTION_LAYOUT } from "@opengovsg/isomer-components"

import { createDefaultHeroGradientQuickActionsItem } from "../utils/defaultHeroGradientQuickActionsItem"
import { nextHeroGradientActionLayoutData } from "../utils/nextHeroGradientActionLayoutData"

describe("nextHeroGradientActionLayoutData", () => {
  it("drops quick-action fields when switching to buttons", () => {
    // Arrange
    const current: Partial<HeroGradientProps> = {
      type: "hero",
      variant: "gradient",
      title: "Welcome",
      actionLayout: "quickActions",
      quickActionsTitle: "Get started",
      showIcon: true,
      quickActionsItems: [createDefaultHeroGradientQuickActionsItem()],
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
      actionLayout: "buttons",
    })
  })

  it("drops button fields when switching to quick actions", () => {
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
      HERO_GRADIENT_ACTION_LAYOUT.quickActions,
    )

    // Assert
    expect(actual).toEqual({
      type: "hero",
      variant: "gradient",
      title: "Welcome",
      actionLayout: "quickActions",
      quickActionsTitle: "Get started",
      showIcon: true,
      quickActionsItems: [
        createDefaultHeroGradientQuickActionsItem(),
        createDefaultHeroGradientQuickActionsItem(),
      ],
    })
  })
})
