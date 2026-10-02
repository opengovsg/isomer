import { describe, expect, it } from "vitest"

import { getFilterPanelIdSuffix } from "../filterPanelIdSuffix"

describe("getFilterPanelIdSuffix", () => {
  it("replaces spaces in filter ids for valid HTML id tokens", () => {
    // Arrange
    const filterId = "Assurance Level"

    // Act
    const suffix = getFilterPanelIdSuffix(filterId)

    // Assert
    expect(suffix).toBe("Assurance-Level")
    expect(suffix).not.toMatch(/\s/)
  })

  it("trims surrounding whitespace", () => {
    // Arrange
    const filterId = "  Year  "

    // Act
    const suffix = getFilterPanelIdSuffix(filterId)

    // Assert
    expect(suffix).toBe("Year")
  })
})
