import type { JsonSchema } from "@jsonforms/core"
import { HERO_ACTION_LAYOUT } from "@opengovsg/isomer-components"
import { createDefaultHeroActionLayoutQuickActionItem } from "~/components/PageEditor/constants"

import { nextHeroActionLayoutData } from "../JsonFormsHeroActionLayoutControl"

const buttonsSchema = {
  properties: {
    actionLayout: { const: "buttons" },
    buttonLabel: {},
    buttonUrl: {},
  },
} satisfies JsonSchema

const quickActionsSchema = {
  properties: {
    actionLayout: { const: "quickActions" },
    quickActionsTitle: {},
    showIcon: {},
    quickActionsItems: {},
  },
} satisfies JsonSchema

const branches = [buttonsSchema, quickActionsSchema]

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
    const actual = nextHeroActionLayoutData(
      current,
      HERO_ACTION_LAYOUT.buttons,
      branches,
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
    const current = {
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
      branches,
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
