import { describe, expect, it } from "vitest"

import {
  DEFAULT_TAG_CATEGORY_DISPLAY,
  resolveTagCategoryDisplay,
  TAG_CATEGORY_DISPLAY_OPTIONS,
} from "../constants"

describe("resolveTagCategoryDisplay", () => {
  it("defaults missing display to pills for legacy tag categories", () => {
    // Arrange / Act
    const result = resolveTagCategoryDisplay(undefined)

    // Assert
    expect(result).toBe(DEFAULT_TAG_CATEGORY_DISPLAY)
    expect(result).toBe(TAG_CATEGORY_DISPLAY_OPTIONS.Pills)
  })

  it("returns pills when display is pills", () => {
    // Arrange / Act
    const result = resolveTagCategoryDisplay(TAG_CATEGORY_DISPLAY_OPTIONS.Pills)

    // Assert
    expect(result).toBe(TAG_CATEGORY_DISPLAY_OPTIONS.Pills)
  })

  it("returns plaintext when display is plaintext", () => {
    // Arrange / Act
    const result = resolveTagCategoryDisplay(
      TAG_CATEGORY_DISPLAY_OPTIONS.Plaintext,
    )

    // Assert
    expect(result).toBe(TAG_CATEGORY_DISPLAY_OPTIONS.Plaintext)
  })
})
