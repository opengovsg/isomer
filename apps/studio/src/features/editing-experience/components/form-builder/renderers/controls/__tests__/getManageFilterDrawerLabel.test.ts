import {
  createDefaultDateFilter,
  createDefaultTagCategory,
  getManageFilterDrawerLabel,
} from "../constants"

describe("getManageFilterDrawerLabel", () => {
  it("returns Manage date filter for a date filter", () => {
    // Arrange / Act
    const result = getManageFilterDrawerLabel(createDefaultDateFilter())

    // Assert
    expect(result).toBe("Manage date filter")
  })

  it("returns Manage text filter for a text filter", () => {
    // Arrange / Act
    const result = getManageFilterDrawerLabel(createDefaultTagCategory())

    // Assert
    expect(result).toBe("Manage text filter")
  })

  it("returns Manage text filter when the category is missing", () => {
    // Arrange / Act / Assert
    expect(getManageFilterDrawerLabel(undefined)).toBe("Manage text filter")
  })
})
