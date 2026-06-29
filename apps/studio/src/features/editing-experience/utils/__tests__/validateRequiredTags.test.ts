import type { CollectionTags } from "../../hooks/useCollectionTags"
import { validateRequiredTags } from "../validateRequiredTags"

const REQUIRED_OPTION_ID = "6ba7b810-9dad-11d1-80b4-00c04fd430c8"
const OPTIONAL_OPTION_ID = "7ca8c921-0ebe-22e2-91c5-11d15fe541d9"
const OTHER_REQUIRED_OPTION_ID = "8db9da32-1fcf-33f3-a2d6-22e26gf652e0"

const requiredCategory: CollectionTags[number] = {
  id: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  label: "Topic",
  isRequired: true,
  options: [{ id: REQUIRED_OPTION_ID, label: "Technology" }],
}

const optionalCategory: CollectionTags[number] = {
  id: "a58bd21c-69dd-5483-b678-1f13c3d4e580",
  label: "Region",
  isRequired: false,
  options: [{ id: OPTIONAL_OPTION_ID, label: "Central" }],
}

const otherRequiredCategory: CollectionTags[number] = {
  id: "b69ce32d-7aee-6594-c789-2g24d4e5f691",
  label: "Type",
  isRequired: true,
  options: [{ id: OTHER_REQUIRED_OPTION_ID, label: "Notice" }],
}

describe("validateRequiredTags", () => {
  it("returns valid when there are no tag categories", () => {
    // Act
    const result = validateRequiredTags([], ["anything"])

    // Assert
    expect(result.isValid).toBe(true)
    expect(result.unfilledRequiredCategories).toEqual([])
  })

  it("returns valid when no categories are required", () => {
    // Act
    const result = validateRequiredTags([optionalCategory], undefined)

    // Assert
    expect(result.isValid).toBe(true)
    expect(result.unfilledRequiredCategories).toEqual([])
  })

  it("returns valid when every required category has a selected option", () => {
    // Act
    const result = validateRequiredTags(
      [requiredCategory, optionalCategory],
      [REQUIRED_OPTION_ID],
    )

    // Assert
    expect(result.isValid).toBe(true)
    expect(result.unfilledRequiredCategories).toEqual([])
  })

  it("returns invalid when a required category has no selection", () => {
    // Act
    const result = validateRequiredTags([requiredCategory], [])

    // Assert
    expect(result.isValid).toBe(false)
    expect(result.unfilledRequiredCategories).toEqual([requiredCategory])
  })

  it("returns invalid when tagged is undefined and a category is required", () => {
    // Act
    const result = validateRequiredTags([requiredCategory], undefined)

    // Assert
    expect(result.isValid).toBe(false)
    expect(result.unfilledRequiredCategories).toEqual([requiredCategory])
  })

  it("does not require selections for optional categories", () => {
    // Act
    const result = validateRequiredTags(
      [requiredCategory, optionalCategory],
      [REQUIRED_OPTION_ID],
    )

    // Assert
    expect(result.isValid).toBe(true)
    expect(result.unfilledRequiredCategories).toEqual([])
  })

  it("returns only unfilled required categories when multiple are configured", () => {
    // Act
    const result = validateRequiredTags(
      [requiredCategory, otherRequiredCategory, optionalCategory],
      [REQUIRED_OPTION_ID],
    )

    // Assert
    expect(result.isValid).toBe(false)
    expect(result.unfilledRequiredCategories).toEqual([otherRequiredCategory])
  })

  it("treats a required category with no options as satisfied", () => {
    // Arrange
    const emptyRequiredCategory: CollectionTags[number] = {
      id: "d81ef54f-9cgg-87b6-e9ab-4i46f6g7h813",
      label: "Deleted options",
      isRequired: true,
      options: [],
    }

    // Act
    const result = validateRequiredTags(
      [emptyRequiredCategory, requiredCategory],
      [],
    )

    // Assert
    expect(result.isValid).toBe(false)
    expect(result.unfilledRequiredCategories).toEqual([requiredCategory])
  })

  it("treats isRequired as false when omitted on a category", () => {
    // Arrange
    const categoryWithoutRequiredFlag: CollectionTags[number] = {
      id: "c70df43e-8bff-76a5-d89a-3h35e5f6g702",
      label: "Legacy",
      options: [{ id: OPTIONAL_OPTION_ID, label: "Legacy option" }],
    }

    // Act
    const result = validateRequiredTags(
      [categoryWithoutRequiredFlag],
      undefined,
    )

    // Assert
    expect(result.isValid).toBe(true)
    expect(result.unfilledRequiredCategories).toEqual([])
  })
})
