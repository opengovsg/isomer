import { indicesWithDuplicateLabels } from "../indicesWithDuplicateLabels"

describe("indicesWithDuplicateLabels", () => {
  it("returns an empty set when items are undefined or empty", () => {
    // Arrange
    const undefinedItems = undefined
    const emptyList: { label?: string }[] = []

    // Act
    const resultUndefined = indicesWithDuplicateLabels(undefinedItems)
    const resultEmpty = indicesWithDuplicateLabels(emptyList)

    // Assert
    expect(resultUndefined).toEqual(new Set())
    expect(resultEmpty).toEqual(new Set())
  })

  it("returns an empty set when there is a single item or all labels are unique", () => {
    // Arrange
    const single = [{ label: "a" }]
    const uniquePair = [{ label: "a" }, { label: "b" }]

    // Act
    const resultSingle = indicesWithDuplicateLabels(single)
    const resultUnique = indicesWithDuplicateLabels(uniquePair)

    // Assert
    expect(resultSingle).toEqual(new Set())
    expect(resultUnique).toEqual(new Set())
  })

  it("returns every index in a duplicate group", () => {
    // Arrange
    const pair = [{ label: "a" }, { label: "a" }]
    const triple = [
      { label: "x" },
      { label: "x" },
      { label: "x" },
    ]

    // Act
    const resultPair = indicesWithDuplicateLabels(pair)
    const resultTriple = indicesWithDuplicateLabels(triple)

    // Assert
    expect(resultPair).toEqual(new Set([0, 1]))
    expect(resultTriple).toEqual(new Set([0, 1, 2]))
  })

  it("treats labels as equal when they match after trim and case fold", () => {
    // Arrange
    const items = [{ label: "  Foo  " }, { label: "foo" }]

    // Act
    const result = indicesWithDuplicateLabels(items)

    // Assert
    expect(result).toEqual(new Set([0, 1]))
  })

  it("does not treat empty or whitespace-only labels as duplicates", () => {
    // Arrange
    const emptyLabels = [{ label: "" }, { label: "" }]
    const whitespaceLabels = [{ label: "  " }, { label: "  " }]
    const missingLabels = [{}, {}]

    // Act
    const resultEmpty = indicesWithDuplicateLabels(emptyLabels)
    const resultWhitespace = indicesWithDuplicateLabels(whitespaceLabels)
    const resultMissing = indicesWithDuplicateLabels(missingLabels)

    // Assert
    expect(resultEmpty).toEqual(new Set())
    expect(resultWhitespace).toEqual(new Set())
    expect(resultMissing).toEqual(new Set())
  })

  it("only includes indices that belong to a duplicated label", () => {
    // Arrange
    const items = [
      { label: "dup" },
      { label: "dup" },
      { label: "other" },
    ]

    // Act
    const result = indicesWithDuplicateLabels(items)

    // Assert
    expect(result).toEqual(new Set([0, 1]))
  })
})
