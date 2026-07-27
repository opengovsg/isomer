import {
  CAPTION_MAX_LENGTH,
  clampCaptionLength,
  DEFAULT_TABLE_CAPTION,
  getDisplayTableCaption,
  isPlaceholderTableCaption,
  LEGACY_DEFAULT_TABLE_CAPTION,
  normalizeTableCaptionForEdit,
  resolveCaptionOnBlur,
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

describe("clampCaptionLength", () => {
  it("returns the value unchanged when under the limit", () => {
    // Arrange / Act
    const result = clampCaptionLength("short")

    // Assert
    expect(result).toBe("short")
  })

  it("truncates at CAPTION_MAX_LENGTH", () => {
    // Arrange
    const value = "a".repeat(CAPTION_MAX_LENGTH + 50)

    // Act
    const result = clampCaptionLength(value)

    // Assert
    expect(result).toBe("a".repeat(CAPTION_MAX_LENGTH))
    expect(result).toHaveLength(CAPTION_MAX_LENGTH)
  })
})

describe("resolveCaptionOnBlur", () => {
  it("returns the trimmed draft when non-empty", () => {
    // Arrange / Act
    const result = resolveCaptionOnBlur("  hello  ", "baseline")

    // Assert
    expect(result).toBe("hello")
  })

  it("restores the baseline when the draft is empty or whitespace-only", () => {
    // Arrange / Act / Assert
    expect(resolveCaptionOnBlur("", "Kept caption")).toBe("Kept caption")
    expect(resolveCaptionOnBlur("   ", "Kept caption")).toBe("Kept caption")
  })

  it("allows clearing when the baseline was already empty", () => {
    // Arrange / Act
    const result = resolveCaptionOnBlur("", "")

    // Assert
    expect(result).toBe("")
  })
})
