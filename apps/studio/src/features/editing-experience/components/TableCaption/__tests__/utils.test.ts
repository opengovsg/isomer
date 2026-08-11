import {
  DEFAULT_TABLE_CAPTION,
  isPlaceholderTableCaption,
  LEGACY_DEFAULT_TABLE_CAPTION,
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
