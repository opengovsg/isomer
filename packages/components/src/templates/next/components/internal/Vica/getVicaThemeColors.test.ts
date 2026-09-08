import { describe, expect, it } from "vitest"

import { getVicaThemeColors } from "./getVicaThemeColors"

describe("getVicaThemeColors", () => {
  it("returns hex values when theme colors are provided", () => {
    const colors = getVicaThemeColors({
      brand: {
        canvas: {
          default: "#f0f0f0",
          alt: "#d0d0d0",
          backdrop: "#b0b0b0",
          inverse: "#123456",
        },
        interaction: {
          default: "#123456",
          hover: "#0f2d44",
          pressed: "#0c2433",
        },
      },
    })

    expect(colors).toEqual({
      foreground: "#ffffff",
      brand: "#123456",
      buttonBorder: "#123456",
      canvasBackground: "#f0f0f0",
      quickReplyButtonBackground: "#ffffff",
      autoCompleteBackground: "#f0f0f0",
      autoCompleteHover: "#d0d0d0",
      autoCompleteForeground: "#111827",
      autoCompleteDivider: "#d1d5db",
      recommendationsBackground: "#f0f0f0",
      recommendationsHover: "#d0d0d0",
      recommendationsForeground: "#111827",
    })
  })

  it("does not return CSS variable references", () => {
    const colors = getVicaThemeColors()

    for (const value of Object.values(colors)) {
      expect(value).not.toMatch(/^var\(/)
      expect(value).toMatch(/^#[0-9a-f]{6}$/i)
    }
  })
})
