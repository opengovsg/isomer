import type { CollectionPageCategoryOption } from "~/types/page"
import { describe, expect, it } from "vitest"

import { resolveCategoryLabel } from "../resolveCategoryLabel"

const CATEGORY_OPTIONS: CollectionPageCategoryOption[] = [
  { id: "cat-uuid-1", label: "Policy" },
  { id: "cat-uuid-2", label: "Research" },
]

describe("resolveCategoryLabel", () => {
  it("should resolve categoryId to the matching label from categoryOptions", () => {
    expect(
      resolveCategoryLabel({
        categoryId: "cat-uuid-2",
        category: "legacy",
        categoryOptions: CATEGORY_OPTIONS,
      }),
    ).toBe("Research")
  })

  it("should fall back to legacy category string when no categoryId is present", () => {
    expect(
      resolveCategoryLabel({
        category: "Legacy Category",
        categoryOptions: CATEGORY_OPTIONS,
      }),
    ).toBe("Legacy Category")
  })

  it("should fall back to 'Others' when item has neither categoryId nor category", () => {
    expect(
      resolveCategoryLabel({
        categoryOptions: CATEGORY_OPTIONS,
      }),
    ).toBe("Others")
  })

  it("should fall back to category string when categoryId does not match any option", () => {
    expect(
      resolveCategoryLabel({
        categoryId: "unknown-uuid",
        category: "Legacy Fallback",
        categoryOptions: CATEGORY_OPTIONS,
      }),
    ).toBe("Legacy Fallback")
  })

  it("should use legacy category string when no categoryOptions are passed", () => {
    expect(
      resolveCategoryLabel({
        categoryId: "cat-uuid-1",
        category: "Legacy",
      }),
    ).toBe("Legacy")
  })
})
