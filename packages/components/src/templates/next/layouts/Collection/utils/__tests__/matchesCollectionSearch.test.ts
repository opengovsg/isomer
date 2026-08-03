import { describe, expect, it } from "vitest"

import { matchesCollectionSearch } from "../matchesCollectionSearch"

describe("matchesCollectionSearch", () => {
  const circularTitle =
    "CIRCULAR ON NEW FEEDBACK CHANNEL ON PUBLIC SECTOR FACILITIES MANAGEMENT (FM) PROJECTS AND REVISED GUIDE ON FM PROCUREMENT"

  it("matches case-insensitively and ignores surrounding whitespace in the query", () => {
    // Arrange
    const title = "Guide to Isomer"
    const search = "  guide to isomer  "

    // Act
    const result = matchesCollectionSearch(title, search)

    // Assert
    expect(result).toBe(true)
  })

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

  it("matches when the stored title contains a soft hyphen before parentheses", () => {
    // Arrange
    const title = "MANAGEMENT\u00ad(FM) PROJECTS"
    const search = "management (FM)"

    // Act
    const result = matchesCollectionSearch(title, search)

    // Assert
    expect(result).toBe(true)
  })

  it("matches when the stored title contains a zero-width space before parentheses", () => {
    // Arrange
    const title = "MANAGEMENT\u200b(FM) PROJECTS"
    const search = "management (FM)"

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
