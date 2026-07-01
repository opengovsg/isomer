import { indicesWithBlankLabels } from "../indicesWithBlankLabels"

describe("indicesWithBlankLabels", () => {
  it("returns an empty set when items are undefined or empty", () => {
    // Arrange
    const undefinedItems = undefined
    const emptyList: { label?: string }[] = []

    // Act
    const resultUndefined = indicesWithBlankLabels(undefinedItems)
    const resultEmpty = indicesWithBlankLabels(emptyList)

    // Assert
    expect(resultUndefined).toEqual(new Set())
    expect(resultEmpty).toEqual(new Set())
  })

  it("returns an empty set when every item has a non-blank label", () => {
    // Arrange
    const items = [{ label: "a" }, { label: "b" }]

    // Act
    const result = indicesWithBlankLabels(items)

    // Assert
    expect(result).toEqual(new Set())
  })

  it("returns the index when an item label is an empty string", () => {
    // Arrange
    const items = [{ label: "a" }, { label: "" }]

    // Act
    const result = indicesWithBlankLabels(items)

    // Assert
    expect(result).toEqual(new Set([1]))
  })

  it("returns the index when an item label is whitespace-only", () => {
    // Arrange
    const items = [{ label: "a" }, { label: "   " }]

    // Act
    const result = indicesWithBlankLabels(items)

    // Assert
    expect(result).toEqual(new Set([1]))
  })

  it("returns the index when an item is missing the label property", () => {
    // Arrange
    const items = [{ label: "a" }, {}]

    // Act
    const result = indicesWithBlankLabels(items)

    // Assert
    expect(result).toEqual(new Set([1]))
  })

  it("returns all indices with blank labels", () => {
    // Arrange
    const items = [{ label: "" }, { label: "ok" }, { label: "  " }, {}]

    // Act
    const result = indicesWithBlankLabels(items)

    // Assert
    expect(result).toEqual(new Set([0, 2, 3]))
  })

  it("does not treat trimmed labels as blank", () => {
    // Arrange
    const items = [{ label: "  hello  " }]

    // Act
    const result = indicesWithBlankLabels(items)

    // Assert
    expect(result).toEqual(new Set())
  })
})
