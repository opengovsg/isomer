import type { HeroGradientProps } from "@opengovsg/isomer-components"
import { HERO_ACTION_LAYOUT } from "@opengovsg/isomer-components"

import { createDefaultHeroActionLayoutQuickActionItem } from "../utils/defaultHeroActionLayoutQuickActionItem"
import { nextHeroActionLayoutData } from "../utils/nextHeroActionLayoutData"

describe("nextHeroActionLayoutData", () => {
  it("drops quick-action fields when switching to buttons", () => {
    // Arrange
    const current: Partial<HeroGradientProps> = {
      type: "hero",
      variant: "gradient",
      title: "Welcome",
      actionLayout: "quickActions",
      quickActionsTitle: "Get started",
      showIcon: true,
      quickActionsItems: [createDefaultHeroActionLayoutQuickActionItem()],
    }

    // Act
    const actual = nextHeroActionLayoutData(current, HERO_ACTION_LAYOUT.buttons)

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
    const actual = nextHeroActionLayoutData(
      current,
      HERO_ACTION_LAYOUT.quickActions,
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
        createDefaultHeroActionLayoutQuickActionItem(),
        createDefaultHeroActionLayoutQuickActionItem(),
      ],
    })
  })
})
