import { describe, expect, it } from "vitest"

import { normalizeText } from "../normalizeText"

describe("normalizeText()", () => {
  it(`normalizes english strings`, () => {
    expect(normalizeText("abcdef")).toBe("abcdef")
    expect(normalizeText("   qwerty foo   ")).toBe("qwerty foo")
    expect(normalizeText("\nfoo\n\t")).toBe("foo")
    expect(normalizeText("Fo0 BAR")).toBe("fo0 bar")
    expect(normalizeText(" x ")).toBe("x") // hard space
  })
  it(`removes polish diacritics`, () => {
    expect(normalizeText("ąśćźżółłńę")).toBe("asczzollne")
    expect(normalizeText("ĄŚĆŹŻÓŁŃĘ")).toBe("asczzolne")
  })
  it(`removes other latin diacritics`, () => {
    expect(normalizeText("áéíóúýčďěňřšťžů")).toBe("aeiouycdenrstzu") // Czech
    expect(normalizeText("ẞäöü")).toBe("ßaou") // German
    expect(normalizeText("áéíóúüññ")).toBe("aeiouunn") // Spanish
    expect(normalizeText("Radziu̙̙̙̙̙̙̙̙̙̙̙̙̙̙̙̙͛͛͛͛͛͛͛͛͛͛͛͛ͅ")).toBe("radziu") // zalgo/dbag
  })
  it(`normalizes Russian script`, () => {
    // quirks: Ё->Е, Й->И
    expect(normalizeText("БВГДЖЗКЛМНПРСТФХЦЧШЩАЕЁИОУЫЭЮЯЙЬЪ")).toBe(
      "бвгджзклмнпрстфхцчшщаееиоуыэюяиьъ",
    )
  })
  it(`does kinda nothing to Chinese, Japanese`, () => {
    expect(
      normalizeText(
        "  ラドクリフ、マラソン五輪代表に 1万メートル出場にも含ふくみ  ",
      ),
    ).toBe("ラドクリフ、マラソン五輪代表に 1万メートル出場にも含ふくみ")
    expect(normalizeText(" 日本語 ")).toBe("日本語")
  })
  it(`decomposes Hangul`, () => {
    // looks the same, but the Unicode encoding is different!
    expect(normalizeText(" 한국어 ")).toBe("한국어")
  })
})
