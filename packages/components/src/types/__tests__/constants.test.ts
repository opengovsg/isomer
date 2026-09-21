import { describe, expect, it } from "vitest"

import {
  DEFAULT_TAG_CATEGORY_DISPLAY,
  DEFAULT_TAG_CATEGORY_IS_REQUIRED,
  resolveTagCategoryDisplay,
  resolveTagCategoryIsRequired,
  TAG_CATEGORY_DISPLAY_OPTIONS,
} from "../constants"

describe("resolveTagCategoryDisplay", () => {
  it("defaults missing display to pills for legacy tag categories", () => {
    // Act
    const resolved = resolveTagCategoryDisplay(undefined)

    // Assert
    expect(resolved).toBe(DEFAULT_TAG_CATEGORY_DISPLAY)
    expect(resolved).toBe(TAG_CATEGORY_DISPLAY_OPTIONS.Pills)
  })

  it("returns the stored display when present", () => {
    // Act
    const pills = resolveTagCategoryDisplay(TAG_CATEGORY_DISPLAY_OPTIONS.Pills)
    const plaintext = resolveTagCategoryDisplay(
      TAG_CATEGORY_DISPLAY_OPTIONS.Plaintext,
    )

    // Assert
    expect(pills).toBe(TAG_CATEGORY_DISPLAY_OPTIONS.Pills)
    expect(plaintext).toBe(TAG_CATEGORY_DISPLAY_OPTIONS.Plaintext)
  })
})

describe("resolveTagCategoryIsRequired", () => {
  it("defaults missing isRequired to DEFAULT_TAG_CATEGORY_IS_REQUIRED", () => {
    // Act
    const resolved = resolveTagCategoryIsRequired(undefined)

    // Assert
    expect(resolved).toBe(DEFAULT_TAG_CATEGORY_IS_REQUIRED)
  })

  it("returns the stored isRequired when present", () => {
    // Act
    const required = resolveTagCategoryIsRequired(true)
    const optional = resolveTagCategoryIsRequired(false)

    // Assert
    expect(required).toBe(true)
    expect(optional).toBe(false)
  })
})
