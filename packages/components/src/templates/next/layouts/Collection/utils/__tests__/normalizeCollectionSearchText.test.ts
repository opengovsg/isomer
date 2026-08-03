import { describe, expect, it } from "vitest"

import {
  matchesCollectionSearch,
  normalizeCollectionSearchText,
} from "../normalizeCollectionSearchText"

describe("normalizeCollectionSearchText", () => {
  it("lowercases and trims text", () => {
    // Arrange
    const text = "  Guide To Isomer  "

    // Act
    const result = normalizeCollectionSearchText(text)

    // Assert
    expect(result).toBe("guide to isomer")
  })

  it("normalizes fullwidth parentheses to ASCII", () => {
    // Arrange
    const text = "MANAGEMENT（FM）"

    // Act
    const result = normalizeCollectionSearchText(text)

    // Assert
    expect(result).toBe("management(fm)")
  })

  it("normalizes a non-breaking space before parentheses", () => {
    // Arrange
    const text = "MANAGEMENT\u00a0(FM)"

    // Act
    const result = normalizeCollectionSearchText(text)

    // Assert
    expect(result).toBe("management(fm)")
  })

  it("removes soft hyphens", () => {
    // Arrange
    const text = "MANAGEMENT\u00ad(FM)"

    // Act
    const result = normalizeCollectionSearchText(text)

    // Assert
    expect(result).toBe("management(fm)")
  })

  it("removes zero-width spaces", () => {
    // Arrange
    const text = "MANAGEMENT\u200b(FM)"

    // Act
    const result = normalizeCollectionSearchText(text)

    // Assert
    expect(result).toBe("management(fm)")
  })

  it("treats missing space before parentheses as equivalent to spaced text", () => {
    // Arrange
    const withSpace = normalizeCollectionSearchText("MANAGEMENT (FM)")
    const withoutSpace = normalizeCollectionSearchText("MANAGEMENT(FM)")

    // Assert
    expect(withSpace).toBe(withoutSpace)
  })
})

describe("matchesCollectionSearch", () => {
  const circularTitle =
    "CIRCULAR ON NEW FEEDBACK CHANNEL ON PUBLIC SECTOR FACILITIES MANAGEMENT (FM) PROJECTS AND REVISED GUIDE ON FM PROCUREMENT"

  it("matches a full title search that includes parentheses", () => {
    // Arrange
    const search =
      "CIRCULAR ON NEW FEEDBACK CHANNEL ON PUBLIC SECTOR FACILITIES MANAGEMENT (FM)"

    // Act
    const result = matchesCollectionSearch(circularTitle, search)

    // Assert
    expect(result).toBe(true)
  })

  it("matches a partial search from the middle of the title", () => {
    // Arrange
    const title =
      "Facilities Management (FM) Performance Appraisal Framework for FM Companies"
    const search = "management (FM)"

    // Act
    const result = matchesCollectionSearch(title, search)

    // Assert
    expect(result).toBe(true)
  })

  it("matches when the stored title uses fullwidth parentheses", () => {
    // Arrange
    const title = circularTitle.replace("(FM)", "（FM）")
    const search =
      "CIRCULAR ON NEW FEEDBACK CHANNEL ON PUBLIC SECTOR FACILITIES MANAGEMENT (FM)"

    // Act
    const result = matchesCollectionSearch(title, search)

    // Assert
    expect(result).toBe(true)
  })

  it("matches when the stored title has a non-breaking space before parentheses", () => {
    // Arrange
    const title = circularTitle.replace(" (FM)", "\u00a0(FM)")
    const search =
      "CIRCULAR ON NEW FEEDBACK CHANNEL ON PUBLIC SECTOR FACILITIES MANAGEMENT (FM)"

    // Act
    const result = matchesCollectionSearch(title, search)

    // Assert
    expect(result).toBe(true)
  })

  it("matches when the stored title omits the space before parentheses", () => {
    // Arrange
    const title = circularTitle.replace(" (FM)", "(FM)")
    const search =
      "CIRCULAR ON NEW FEEDBACK CHANNEL ON PUBLIC SECTOR FACILITIES MANAGEMENT (FM)"

    // Act
    const result = matchesCollectionSearch(title, search)

    // Assert
    expect(result).toBe(true)
  })

  it("does not match unrelated search terms", () => {
    // Arrange
    const search = "completely unrelated query"

    // Act
    const result = matchesCollectionSearch(circularTitle, search)

    // Assert
    expect(result).toBe(false)
  })
})
