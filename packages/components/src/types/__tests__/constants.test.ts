import { describe, expect, it } from "vitest"

import {
  DEFAULT_TAG_CATEGORY_DISPLAY,
  resolveTagCategoryDisplay,
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
