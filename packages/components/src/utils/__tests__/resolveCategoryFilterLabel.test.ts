import { describe, expect, it } from "vitest"

import {
  DEFAULT_CATEGORY_FILTER_LABEL,
  resolveCategoryFilterLabel,
} from "../resolveCategoryFilterLabel"

describe("resolveCategoryFilterLabel", () => {
  it("returns the custom label when provided", () => {
    // Arrange / Act
    const result = resolveCategoryFilterLabel("Topic")

    // Assert
    expect(result).toBe("Topic")
  })

  it("trims leading and trailing whitespace from the label", () => {
    // Arrange / Act
    const result = resolveCategoryFilterLabel("  Topic  ")

    // Assert
    expect(result).toBe("Topic")
  })

  it.each([
    ["omitted", undefined],
    ["empty string", ""],
    ["whitespace", "   "],
  ] as const)(
    "falls back to DEFAULT_CATEGORY_FILTER_LABEL when categoryLabel is %s",
    (_, categoryLabel) => {
      // Arrange / Act
      const result = resolveCategoryFilterLabel(categoryLabel)

      // Assert
      expect(result).toBe(DEFAULT_CATEGORY_FILTER_LABEL)
    },
  )
})
