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

  it("restores a stashed quick-actions branch over defaults", () => {
    // Arrange
    const current = {
      type: "hero",
      title: "Welcome",
      actionLayout: "buttons",
    }
    const restored = {
      quickActionsTitle: "Custom",
      showIcon: false,
      quickActionsItems: [{ title: "Apply" }],
    }

    // Act
    const actual = nextHeroActionLayoutData(
      current,
      HERO_ACTION_LAYOUT.quickActions,
      branches,
      restored,
    )

    // Assert
    expect(actual).toEqual({
      type: "hero",
      title: "Welcome",
      actionLayout: "quickActions",
      quickActionsTitle: "Custom",
      showIcon: false,
      quickActionsItems: [{ title: "Apply" }],
    })
  })

  it("restores stashed button fields and drops quick-action fields", () => {
    // Arrange
    const current = {
      type: "hero",
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
      { buttonLabel: "Apply", buttonUrl: "/apply" },
    )

    // Assert
    expect(actual).toEqual({
      type: "hero",
      title: "Welcome",
      actionLayout: "buttons",
      buttonLabel: "Apply",
      buttonUrl: "/apply",
    })
  })

  it("round-trips quick actions through buttons when the caller passes the stash", () => {
    // Arrange
    const authored = {
      type: "hero",
      title: "Welcome",
      actionLayout: "quickActions",
      quickActionsTitle: "Custom",
      showIcon: false,
      quickActionsItems: [{ title: "Apply" }],
    }
    const stashed = {
      quickActionsTitle: authored.quickActionsTitle,
      showIcon: authored.showIcon,
      quickActionsItems: authored.quickActionsItems,
    }
    const asButtons = nextHeroActionLayoutData(
      authored,
      HERO_ACTION_LAYOUT.buttons,
      branches,
    )

    // Act
    const actual = nextHeroActionLayoutData(
      asButtons,
      HERO_ACTION_LAYOUT.quickActions,
      branches,
      stashed,
    )

    // Assert
    expect(actual).toEqual(authored)
  })

  it("round-trips buttons through quick actions when the caller passes the stash", () => {
    // Arrange
    const authored = {
      type: "hero",
      title: "Welcome",
      actionLayout: "buttons",
      buttonLabel: "Apply",
      buttonUrl: "/apply",
    }
    const stashed = {
      buttonLabel: authored.buttonLabel,
      buttonUrl: authored.buttonUrl,
    }
    const asQuickActions = nextHeroActionLayoutData(
      authored,
      HERO_ACTION_LAYOUT.quickActions,
      branches,
    )

    // Act
    const actual = nextHeroActionLayoutData(
      asQuickActions,
      HERO_ACTION_LAYOUT.buttons,
      branches,
      stashed,
    )

    // Assert
    expect(actual).toEqual(authored)
  })
})
