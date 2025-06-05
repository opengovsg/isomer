import { merge } from "../merge"

describe("merge", () => {
  it("should put strings that are not in base at the back and sorted by title", () => {
    // Arrange
    const base = ["2", "1", "53"]
    const all = ["12", "4", "5", "2", "53", "1"]
    const mappings = new Map([
      ["12", "abc"],
      ["4", "cde"],
      ["5", "aaaaaa"],
      ["2", "b"],
      ["53", "ab"],
      ["1", "aaaaa"],
    ])

    // Act
    const expected = ["2", "1", "53", "5", "12", "4"]

    // Assert
    const actual = merge(base, all, mappings)
    expect(actual).toStrictEqual(expected)
  })

  it("should remove strings that are in base but not in all", () => {
    // Arrange
    const base = ["2", "1", "53"]
    const all = ["12", "4", "5"]
    const mappings = new Map([
      ["12", "abc"],
      ["4", "cde"],
      ["5", "aaaaaa"],
    ])

    // Act
    const expected = ["5", "12", "4"]

    // Assert
    const actual = merge(base, all, mappings)
    expect(actual).toStrictEqual(expected)
  })

  it("should respect the casing of the title", () => {
    // Arrange
    const base = ["2", "1", "53"]
    const all = ["12", "4", "5", "2", "53", "1"]
    const mappings = new Map([
      ["12", "AAA"],
      ["4", "aaa"],
      ["5", "AAAA"],
      ["2", "b"],
      ["53", "ab"],
      ["1", "aaaaa"],
    ])

    // Act
    const expected = ["2", "1", "53", "4", "12", "5"]

    // Assert
    const actual = merge(base, all, mappings)
    expect(actual).toStrictEqual(expected)
  })
})
