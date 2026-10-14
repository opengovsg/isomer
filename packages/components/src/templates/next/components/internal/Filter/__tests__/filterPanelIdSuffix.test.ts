import { describe, expect, it } from "vitest"

import { getFilterPanelIdSuffix } from "../filterPanelIdSuffix"

describe("getFilterPanelIdSuffix", () => {
  it("percent-encodes spaces for valid HTML id tokens", () => {
    // Arrange
    const filterId = "Assurance Level"

    // Act
    const suffix = getFilterPanelIdSuffix(filterId)

    // Assert
    expect(suffix).toBe("Assurance%20Level")
    expect(suffix).not.toMatch(/\s/)
  })

  it("trims surrounding whitespace before encoding", () => {
    // Arrange
    const filterId = "  Year  "

    // Act
    const suffix = getFilterPanelIdSuffix(filterId)

    // Assert
    expect(suffix).toBe("Year")
  })

  it("keeps distinct labels from colliding after encoding", () => {
    // Arrange
    const spaced = "Assurance Level"
    const hyphenated = "Assurance-Level"
    const doubleSpaced = "Research  Area"

    // Act
    const spacedSuffix = getFilterPanelIdSuffix(spaced)
    const hyphenatedSuffix = getFilterPanelIdSuffix(hyphenated)
    const doubleSpacedSuffix = getFilterPanelIdSuffix(doubleSpaced)

    // Assert
    expect(spacedSuffix).not.toBe(hyphenatedSuffix)
    expect(getFilterPanelIdSuffix("Research Area")).not.toBe(doubleSpacedSuffix)
  })
})
