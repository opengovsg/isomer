import { describe, expect, it } from "vitest"

import { getHeadingTag } from "../getHeadingTag"

describe("getHeadingTag", () => {
  it("should map levels 1 through 6 to their matching tag", () => {
    // Arrange
    const levels = [1, 2, 3, 4, 5, 6] as const

    // Act
    const tags = levels.map((level) => getHeadingTag(level))

    // Assert
    expect(tags).toEqual(["h1", "h2", "h3", "h4", "h5", "h6"])
  })

  it("should clamp levels below 1 to h1", () => {
    // Arrange
    const levels = [0, -5]

    // Act
    const tags = levels.map((level) => getHeadingTag(level))

    // Assert
    expect(tags).toEqual(["h1", "h1"])
  })

  it("should clamp levels above 6 to h6", () => {
    // Arrange
    const levels = [7, 100]

    // Act
    const tags = levels.map((level) => getHeadingTag(level))

    // Assert
    expect(tags).toEqual(["h6", "h6"])
  })

  it("should round non-integer levels", () => {
    // Arrange
    const roundsDown = 2.4
    const roundsUp = 2.6

    // Act
    const roundedDownTag = getHeadingTag(roundsDown)
    const roundedUpTag = getHeadingTag(roundsUp)

    // Assert
    expect(roundedDownTag).toBe("h2")
    expect(roundedUpTag).toBe("h3")
  })
})
