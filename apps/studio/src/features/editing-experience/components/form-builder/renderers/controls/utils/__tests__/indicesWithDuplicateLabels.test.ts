import { describe, expect, it } from 'vitest';
import { indicesWithDuplicateLabels } from "../indicesWithDuplicateLabels"

describe(indicesWithDuplicateLabels, () => {

  it("returns an empty set when items are undefined or empty", () => {
    // Arrange
    const undefinedItems = undefined
    const emptyList: { label?: string }[] = []

    // Act
    const resultUndefined = indicesWithDuplicateLabels(undefinedItems)
    const resultEmpty = indicesWithDuplicateLabels(emptyList)

    // Assert
    expect(resultUndefined).toStrictEqual(new Set())
    expect(resultEmpty).toStrictEqual(new Set())
  })

  it("returns an empty set when there is a single item or all labels are unique", () => {
    // Arrange
    const single = [{ label: "a" }]
    const uniquePair = [{ label: "a" }, { label: "b" }]

    // Act
    const resultSingle = indicesWithDuplicateLabels(single)
    const resultUnique = indicesWithDuplicateLabels(uniquePair)

    // Assert
    expect(resultSingle).toStrictEqual(new Set())
    expect(resultUnique).toStrictEqual(new Set())
  })

  it("returns every index in a duplicate group", () => {
    // Arrange
    const pair = [{ label: "a" }, { label: "a" }]
    const triple = [{ label: "x" }, { label: "x" }, { label: "x" }]

    // Act
    const resultPair = indicesWithDuplicateLabels(pair)
    const resultTriple = indicesWithDuplicateLabels(triple)

    // Assert
    expect(resultPair).toStrictEqual(new Set([0, 1]))
    expect(resultTriple).toStrictEqual(new Set([0, 1, 2]))
  })

  it("treats labels as equal when they match after trim and case fold", () => {
    // Arrange
    const items = [{ label: "  Foo  " }, { label: "foo" }]

    // Act
    const result = indicesWithDuplicateLabels(items)

    // Assert
    expect(result).toStrictEqual(new Set([0, 1]))
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
    expect(resultEmpty).toStrictEqual(new Set())
    expect(resultWhitespace).toStrictEqual(new Set())
    expect(resultMissing).toStrictEqual(new Set())
  })

  it("only includes indices that belong to a duplicated label", () => {
    // Arrange
    const items = [{ label: "dup" }, { label: "dup" }, { label: "other" }]

    // Act
    const result = indicesWithDuplicateLabels(items)

    // Assert
    expect(result).toStrictEqual(new Set([0, 1]))
  })
})
