import { describe, expect, it } from "vitest"

import {
  DEFAULT_TAG_CATEGORY_DISPLAY,
  isDateCategoryType,
  resolveTagCategoryDisplay,
  resolveTagCategoryType,
  TAG_CATEGORY_DISPLAY_OPTIONS,
  TAG_CATEGORY_TYPE,
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

describe("resolveTagCategoryType", () => {
  it("defaults missing type to text for legacy tag categories", () => {
    // Arrange / Act / Assert
    expect(resolveTagCategoryType(undefined)).toBe(TAG_CATEGORY_TYPE.Text)
  })

  it("returns text when type is text", () => {
    // Arrange / Act / Assert
    expect(resolveTagCategoryType(TAG_CATEGORY_TYPE.Text)).toBe(
      TAG_CATEGORY_TYPE.Text,
    )
  })

  it("returns date when type is date", () => {
    // Arrange / Act / Assert
    expect(resolveTagCategoryType(TAG_CATEGORY_TYPE.Date)).toBe(
      TAG_CATEGORY_TYPE.Date,
    )
  })
})

describe("isDateCategoryType", () => {
  it("is false when type is missing", () => {
    // Arrange / Act / Assert
    expect(isDateCategoryType(undefined)).toBe(false)
  })

  it("is false when type is text", () => {
    // Arrange / Act / Assert
    expect(isDateCategoryType(TAG_CATEGORY_TYPE.Text)).toBe(false)
  })

  it("is true when type is date", () => {
    // Arrange / Act / Assert
    expect(isDateCategoryType(TAG_CATEGORY_TYPE.Date)).toBe(true)
  })
})
