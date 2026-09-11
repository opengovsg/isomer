import {
  DEFAULT_TABLE_CAPTION,
  isPlaceholderTableCaption,
  LEGACY_DEFAULT_TABLE_CAPTION,
} from "../utils"

describe("isPlaceholderTableCaption", () => {
  it("treats empty and default captions as placeholders", () => {
    expect(isPlaceholderTableCaption("")).toBe(true)
    expect(isPlaceholderTableCaption("   ")).toBe(true)
    expect(isPlaceholderTableCaption(DEFAULT_TABLE_CAPTION)).toBe(true)
    expect(isPlaceholderTableCaption(LEGACY_DEFAULT_TABLE_CAPTION)).toBe(true)
  })

  it("treats real captions as non-placeholder", () => {
    expect(isPlaceholderTableCaption("Quarterly revenue")).toBe(false)
  })
})
