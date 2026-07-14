import {
  CAPTION_MAX_LENGTH,
  CAPTION_TABLE_GAP_PX,
  captionRectsEqual,
  clampCaptionLength,
  computeCaptionLayout,
  resolveCaptionOnBlur,
} from "../utils"

describe("clampCaptionLength", () => {
  it("returns the value unchanged when under the limit", () => {
    expect(clampCaptionLength("short")).toBe("short")
  })

  it("truncates at CAPTION_MAX_LENGTH", () => {
    const value = "a".repeat(CAPTION_MAX_LENGTH + 50)
    expect(clampCaptionLength(value)).toBe("a".repeat(CAPTION_MAX_LENGTH))
    expect(clampCaptionLength(value)).toHaveLength(CAPTION_MAX_LENGTH)
  })
})

describe("resolveCaptionOnBlur", () => {
  it("returns the trimmed draft when non-empty", () => {
    expect(resolveCaptionOnBlur("  hello  ", "baseline")).toBe("hello")
  })

  it("restores the baseline when the draft is empty or whitespace-only", () => {
    expect(resolveCaptionOnBlur("", "Kept caption")).toBe("Kept caption")
    expect(resolveCaptionOnBlur("   ", "Kept caption")).toBe("Kept caption")
  })

  it("allows clearing when the baseline was already empty", () => {
    expect(resolveCaptionOnBlur("", "")).toBe("")
  })
})

describe("computeCaptionLayout", () => {
  it("places the caption above the table, accounting container offset, scroll, height, and gap", () => {
    const { rect, marginTop } = computeCaptionLayout({
      tableRect: { top: 200, left: 50, width: 400 },
      containerRect: { top: 100, left: 10 },
      scrollTop: 20,
      scrollLeft: 5,
      captionHeight: 24,
      gapPx: 8,
    })

    // marginTop reserves caption height + gap on the table DOM node
    expect(marginTop).toBe(24 + 8)
    // top = (table.top - container.top) + scrollTop - marginTop
    expect(rect.top).toBe(200 - 100 + 20 - 32)
    // left = (table.left - container.left) + scrollLeft
    expect(rect.left).toBe(50 - 10 + 5)
    expect(rect.width).toBe(400)
  })

  it("defaults gapPx to CAPTION_TABLE_GAP_PX", () => {
    const { marginTop } = computeCaptionLayout({
      tableRect: { top: 0, left: 0, width: 100 },
      containerRect: { top: 0, left: 0 },
      scrollTop: 0,
      scrollLeft: 0,
      captionHeight: 10,
    })
    expect(marginTop).toBe(10 + CAPTION_TABLE_GAP_PX)
  })
})

describe("captionRectsEqual", () => {
  it("returns false when previous is null", () => {
    expect(
      captionRectsEqual(null, { top: 0, left: 0, width: 100 }),
    ).toBe(false)
  })

  it("returns true only when all fields match", () => {
    const rect = { top: 1, left: 2, width: 3 }
    expect(captionRectsEqual(rect, { top: 1, left: 2, width: 3 })).toBe(true)
    expect(captionRectsEqual(rect, { top: 9, left: 2, width: 3 })).toBe(false)
  })
})
