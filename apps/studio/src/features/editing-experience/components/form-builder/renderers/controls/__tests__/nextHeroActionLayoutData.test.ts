import { HERO_ACTION_LAYOUT } from "@opengovsg/isomer-components"

import { nextHeroActionLayoutData } from "../JsonFormsHeroActionLayoutControl"

const buttonsSchema = {
  properties: {
    actionLayout: { const: "buttons" },
    buttonLabel: {},
    buttonUrl: {},
  },
}

const quickActionsSchema = {
  properties: {
    actionLayout: { const: "quickActions" },
    quickActionsTitle: {},
    showIcon: {},
    quickActionsItems: {},
  },
}

describe("nextHeroActionLayoutData", () => {
  it("drops quick-action fields when switching to buttons", () => {
    // Arrange
    const current = {
      type: "hero",
      variant: "gradient",
      title: "Welcome",
      actionLayout: "quickActions",
      quickActionsTitle: "Get started",
      showIcon: true,
      quickActionsItems: [{ title: "Apply" }],
    }

    // Act
    const actual = nextHeroActionLayoutData({
      current,
      nextData: { actionLayout: "buttons" },
      selectedSchema: buttonsSchema,
      otherSchemas: [quickActionsSchema],
      layout: HERO_ACTION_LAYOUT.buttons,
    })

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
    const current = {
      type: "hero",
      variant: "gradient",
      title: "Welcome",
      buttonLabel: "Apply",
      buttonUrl: "/apply",
    }

    // Act
    const actual = nextHeroActionLayoutData({
      current,
      nextData: { actionLayout: "quickActions", showIcon: true },
      selectedSchema: quickActionsSchema,
      otherSchemas: [buttonsSchema],
      layout: HERO_ACTION_LAYOUT.quickActions,
    })

    // Assert
    expect(actual).toEqual({
      type: "hero",
      variant: "gradient",
      title: "Welcome",
      actionLayout: "quickActions",
      showIcon: true,
      quickActionsTitle: "Get started",
    })
  })
})
