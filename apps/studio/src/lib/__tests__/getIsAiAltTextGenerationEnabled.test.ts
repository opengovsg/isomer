import { GrowthBook } from "@growthbook/growthbook"
import { describe, expect, it } from "vitest"

import {
  ENABLE_AI_ALT_TEXT_GENERATION_FEATURE_KEY,
  getIsAiAltTextGenerationEnabled,
} from "../growthbook"

const featureForEmail = (email: string) =>
  new GrowthBook({
    features: {
      [ENABLE_AI_ALT_TEXT_GENERATION_FEATURE_KEY]: {
        defaultValue: { enabledSites: [] },
        rules: [
          {
            condition: { email },
            force: { enabledSites: ["1"] },
          },
        ],
      },
    },
  })

describe("getIsAiAltTextGenerationEnabled", () => {
  it("enables the site for the targeted email", async () => {
    // Arrange
    const gb = featureForEmail("alice@example.com")

    // Act
    const enabled = await getIsAiAltTextGenerationEnabled({
      gb,
      siteId: 1,
      email: "alice@example.com",
    })

    // Assert
    expect(enabled).toBe(true)
  })

  it("leaves the site off for a different email", async () => {
    // Arrange
    const gb = featureForEmail("alice@example.com")

    // Act
    const enabled = await getIsAiAltTextGenerationEnabled({
      gb,
      siteId: 1,
      email: "bob@example.com",
    })

    // Assert
    expect(enabled).toBe(false)
  })
})
