import {
  CAPTION_MAX_LENGTH,
  CAPTION_TABLE_GAP_PX,
  captionRectsEqual,
  clampCaptionLength,
  computeCaptionLayout,
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

describe("computeCaptionLayout", () => {
  it("places the caption at the margin edge in steady state", () => {
    // Arrange: table already has the reserved margin matching caption + gap
    const captionHeight = 24
    const gapPx = 8
    const currentMarginTop = captionHeight + gapPx

    // Act
    const { rect, marginTop } = computeCaptionLayout({
      tableRect: { top: 200, left: 50, width: 400 },
      containerRect: { top: 100, left: 10 },
      scrollTop: 20,
      scrollLeft: 5,
      captionHeight,
      currentMarginTop,
      gapPx,
    })

    // Assert
    expect(marginTop).toBe(captionHeight + gapPx)
    // top = (table.top - container.top) + scrollTop - currentMarginTop
    expect(rect.top).toBe(200 - 100 + 20 - currentMarginTop)
    expect(rect.left).toBe(50 - 10 + 5)
    expect(rect.width).toBe(400)
  })

  it("defaults gapPx to CAPTION_TABLE_GAP_PX", () => {
    // Arrange / Act
    const { marginTop } = computeCaptionLayout({
      tableRect: { top: 0, left: 0, width: 100 },
      containerRect: { top: 0, left: 0 },
      scrollTop: 0,
      scrollLeft: 0,
      captionHeight: 10,
      currentMarginTop: 0,
    })

    // Assert
    expect(marginTop).toBe(10 + CAPTION_TABLE_GAP_PX)
  })

  it("keeps caption top stable when height grows (focus counter)", () => {
    // Arrange: steady-state caption, then counter appears (height 24 → 44)
    const gapPx = 8
    const tableBorderTop = 200
    const containerTop = 100
    const scrollTop = 0
    const unfocusedHeight = 24
    const focusedHeight = 44
    const currentMarginTop = unfocusedHeight + gapPx

    const before = computeCaptionLayout({
      tableRect: { top: tableBorderTop, left: 0, width: 400 },
      containerRect: { top: containerTop, left: 0 },
      scrollTop,
      scrollLeft: 0,
      captionHeight: unfocusedHeight,
      currentMarginTop,
      gapPx,
    })

    // Act: same table border-box (margin not yet updated), taller caption
    const after = computeCaptionLayout({
      tableRect: { top: tableBorderTop, left: 0, width: 400 },
      containerRect: { top: containerTop, left: 0 },
      scrollTop,
      scrollLeft: 0,
      captionHeight: focusedHeight,
      currentMarginTop,
      gapPx,
    })

    // Assert: input line must not jump up; only reserved margin grows
    expect(after.rect.top).toBe(before.rect.top)
    expect(after.marginTop).toBe(focusedHeight + gapPx)
    expect(after.marginTop - before.marginTop).toBe(
      focusedHeight - unfocusedHeight,
    )
  })

  it("keeps caption top stable when height shrinks (blur counter)", () => {
    // Arrange: focused caption with counter, then counter disappears (44 → 24)
    const gapPx = 8
    const tableBorderTop = 200
    const containerTop = 100
    const scrollTop = 0
    const focusedHeight = 44
    const unfocusedHeight = 24
    const currentMarginTop = focusedHeight + gapPx

    const before = computeCaptionLayout({
      tableRect: { top: tableBorderTop, left: 0, width: 400 },
      containerRect: { top: containerTop, left: 0 },
      scrollTop,
      scrollLeft: 0,
      captionHeight: focusedHeight,
      currentMarginTop,
      gapPx,
    })

    // Act: same table border-box (margin not yet updated), shorter caption
    const after = computeCaptionLayout({
      tableRect: { top: tableBorderTop, left: 0, width: 400 },
      containerRect: { top: containerTop, left: 0 },
      scrollTop,
      scrollLeft: 0,
      captionHeight: unfocusedHeight,
      currentMarginTop,
      gapPx,
    })

    // Assert: caption must not drop into the table; top stays on margin edge
    expect(after.rect.top).toBe(before.rect.top)
    expect(after.marginTop).toBe(unfocusedHeight + gapPx)
    // After applying the new (smaller) margin, table moves up by the delta;
    // caption bottom + gap should still equal the new table border top.
    const captionBottom = after.rect.top + unfocusedHeight
    const newTableBorderTop = after.rect.top + after.marginTop // margin-edge + new margin
    expect(newTableBorderTop - captionBottom).toBe(gapPx)
  })
})

describe("captionRectsEqual", () => {
  it("returns false when previous is null", () => {
    // Arrange / Act
    const result = captionRectsEqual(null, { top: 0, left: 0, width: 100 })

    // Assert
    expect(result).toBe(false)
  })

  it("returns true only when all fields match", () => {
    // Arrange
    const rect = { top: 1, left: 2, width: 3 }

    // Arrange / Act / Assert
    expect(captionRectsEqual(rect, { top: 1, left: 2, width: 3 })).toBe(true)
    expect(captionRectsEqual(rect, { top: 9, left: 2, width: 3 })).toBe(false)
  })
})
