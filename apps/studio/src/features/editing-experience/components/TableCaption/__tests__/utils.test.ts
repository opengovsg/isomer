import {
  DEFAULT_TABLE_CAPTION,
  getDisplayTableCaption,
  isPlaceholderTableCaption,
  LEGACY_DEFAULT_TABLE_CAPTION,
  normalizeTableCaptionForEdit,
} from "../utils"

describe("isPlaceholderTableCaption", () => {
  it("treats empty and default captions as placeholders", () => {
    // Arrange / Act / Assert
    expect(isPlaceholderTableCaption("")).toBe(true)
    expect(isPlaceholderTableCaption("   ")).toBe(true)
    expect(isPlaceholderTableCaption(DEFAULT_TABLE_CAPTION)).toBe(true)
    expect(isPlaceholderTableCaption(LEGACY_DEFAULT_TABLE_CAPTION)).toBe(true)
  })

  it("treats real captions as non-placeholder", () => {
    // Arrange / Act
    const result = isPlaceholderTableCaption("Quarterly revenue")

    // Assert
    expect(result).toBe(false)
  })
})

describe("normalizeTableCaptionForEdit", () => {
  it("returns an empty string for placeholder captions", () => {
    // Arrange / Act / Assert
    expect(normalizeTableCaptionForEdit(DEFAULT_TABLE_CAPTION)).toBe("")
    expect(normalizeTableCaptionForEdit(LEGACY_DEFAULT_TABLE_CAPTION)).toBe("")
  })

  it("returns the caption unchanged when it is real content", () => {
    // Arrange / Act
    const result = normalizeTableCaptionForEdit("Quarterly revenue")

    // Assert
    expect(result).toBe("Quarterly revenue")
  })
})

describe("getDisplayTableCaption", () => {
  it("returns placeholder defaults for unfilled captions", () => {
    // Arrange / Act / Assert
    expect(getDisplayTableCaption("")).toBe(DEFAULT_TABLE_CAPTION)
    expect(getDisplayTableCaption(DEFAULT_TABLE_CAPTION)).toBe(
      DEFAULT_TABLE_CAPTION,
    )
    expect(getDisplayTableCaption(LEGACY_DEFAULT_TABLE_CAPTION)).toBe(
      LEGACY_DEFAULT_TABLE_CAPTION,
    )
  })

  it("returns the caption unchanged when it is real content", () => {
    // Arrange / Act
    const result = getDisplayTableCaption("Quarterly revenue")

    // Assert
    expect(result).toBe("Quarterly revenue")
  })
})
