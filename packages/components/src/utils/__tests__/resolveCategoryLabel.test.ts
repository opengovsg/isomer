import { describe, expect, it } from "vitest"

import { resolveCategoryLabel } from "../resolveCategoryLabel"

describe("resolveCategoryLabel", () => {
  it("should return the category string when present", () => {
    expect(
      resolveCategoryLabel({
        category: "Legacy Category",
      }),
    ).toBe("Legacy Category")
  })

  it("should fall back to 'Others' when category is absent", () => {
    expect(resolveCategoryLabel({})).toBe("Others")
  })
})
