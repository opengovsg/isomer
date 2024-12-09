import { describe, expect, it } from "vitest"

import { getWordsFromPermalink } from "~/utils"

describe("getWordsFromPermalink", () => {
  it("should trim out all symbols and return the permalink as a space separated sentence for single level permalinks", () => {
    // Arrange
    const singleLevelPermalink = "/this-._single=level|"
    const expected = "this+single+level"

    // Act
    const actual = getWordsFromPermalink(singleLevelPermalink)

    // Assert
    expect(actual).toBe(expected)
  })

  it("should trim out all symbols and return the last section as a space separated sentence for nested permalinks", () => {
    // Arrange
    const nestedPermalink = "/nested/deeply/this-._nest'fff=level|"
    const expected = "this+nest+fff+level"

    // Act
    const actual = getWordsFromPermalink(nestedPermalink)

    // Assert
    expect(actual).toBe(expected)
  })

  it("should handle uri-encoded strings correctly", () => {
    // Arrange
    const singleLevelPermalink = "/this-._single=level|"
    const encodedPermalink = encodeURIComponent(singleLevelPermalink)
    const expected = "this+single+level"

    // Act
    const actual = getWordsFromPermalink(encodedPermalink)

    // Assert
    expect(actual).toBe(expected)
  })

  it("should work with a trailing /", () => {
    // Arrange
    const singleLevelPermalink = "/this-._single=level|/"
    const expected = "this+single+level"

    // Act
    const actual = getWordsFromPermalink(singleLevelPermalink)

    // Assert
    expect(actual).toBe(expected)
  })
})
