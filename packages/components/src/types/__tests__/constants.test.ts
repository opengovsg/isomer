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
    expect(resolveTagCategoryDisplay(undefined)).toBe(
      DEFAULT_TAG_CATEGORY_DISPLAY,
    )
    expect(resolveTagCategoryDisplay(undefined)).toBe(
      TAG_CATEGORY_DISPLAY_OPTIONS.Pills,
    )
  })

  it("returns the stored display when present", () => {
    expect(resolveTagCategoryDisplay(TAG_CATEGORY_DISPLAY_OPTIONS.Pills)).toBe(
      TAG_CATEGORY_DISPLAY_OPTIONS.Pills,
    )
    expect(
      resolveTagCategoryDisplay(TAG_CATEGORY_DISPLAY_OPTIONS.Plaintext),
    ).toBe(TAG_CATEGORY_DISPLAY_OPTIONS.Plaintext)
  })
})

describe("resolveTagCategoryIsRequired", () => {
  it("treats missing or false isRequired as optional", () => {
    expect(resolveTagCategoryIsRequired(undefined)).toBe(false)
    expect(resolveTagCategoryIsRequired(false)).toBe(false)
  })

  it("returns true only when isRequired is explicitly true", () => {
    expect(resolveTagCategoryIsRequired(true)).toBe(true)
  })
})
