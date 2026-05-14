import { hasBlankOptionLabel } from "../hasBlankOptionLabel"

describe("hasBlankOptionLabel", () => {
  it("returns false when items are undefined or empty", () => {
    // Arrange
    const undefinedItems = undefined
    const emptyList: { label?: string }[] = []

    // Act
    const resultUndefined = hasBlankOptionLabel(undefinedItems)
    const resultEmpty = hasBlankOptionLabel(emptyList)

    // Assert
    expect(resultUndefined).toBe(false)
    expect(resultEmpty).toBe(false)
  })

  it("returns false when every item has a non-blank label", () => {
    // Arrange
    const items = [{ label: "a" }, { label: "b" }]

    // Act
    const result = hasBlankOptionLabel(items)

    // Assert
    expect(result).toBe(false)
  })

  it("returns true when an item label is an empty string", () => {
    // Arrange
    const items = [{ label: "a" }, { label: "" }]

    // Act
    const result = hasBlankOptionLabel(items)

    // Assert
    expect(result).toBe(true)
  })

  it("returns true when an item label is whitespace-only", () => {
    // Arrange
    const items = [{ label: "a" }, { label: "   " }]

    // Act
    const result = hasBlankOptionLabel(items)

    // Assert
    expect(result).toBe(true)
  })

  it("returns true when an item is missing the label property", () => {
    // Arrange
    const items = [{ label: "a" }, {}]

    // Act
    const result = hasBlankOptionLabel(items)

    // Assert
    expect(result).toBe(true)
  })
})
