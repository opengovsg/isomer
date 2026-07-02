import {
  CATEGORY_SELECTION_ERROR_MESSAGE,
  isCategorySelectionValid,
} from "../validateCategorySelection"

describe("validateCategorySelection", () => {
  it("exports the expected error message", () => {
    expect(CATEGORY_SELECTION_ERROR_MESSAGE).toBe("Please select an option.")
  })

  it("returns valid when there are no configurable options", () => {
    expect(
      isCategorySelectionValid({
        hasConfigurableOptions: false,
        categoryId: undefined,
        category: undefined,
        useCategoryId: true,
      }),
    ).toBe(true)
  })

  it("returns invalid when categoryId is required but missing", () => {
    expect(
      isCategorySelectionValid({
        hasConfigurableOptions: true,
        categoryId: undefined,
        category: "Legacy",
        useCategoryId: true,
      }),
    ).toBe(false)
  })

  it("returns invalid when categoryId is only whitespace", () => {
    expect(
      isCategorySelectionValid({
        hasConfigurableOptions: true,
        categoryId: "   ",
        useCategoryId: true,
      }),
    ).toBe(false)
  })

  it("returns valid when categoryId is selected", () => {
    expect(
      isCategorySelectionValid({
        hasConfigurableOptions: true,
        categoryId: "cat-uuid-1",
        useCategoryId: true,
      }),
    ).toBe(true)
  })

  it("returns invalid when legacy category is required but missing", () => {
    expect(
      isCategorySelectionValid({
        hasConfigurableOptions: true,
        category: undefined,
        categoryId: "cat-uuid-1",
        useCategoryId: false,
      }),
    ).toBe(false)
  })

  it("returns valid when legacy category is selected", () => {
    expect(
      isCategorySelectionValid({
        hasConfigurableOptions: true,
        category: "Policy",
        useCategoryId: false,
      }),
    ).toBe(true)
  })
})
