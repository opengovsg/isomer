import { describe, expect, it } from "vitest"

import { getHexFromThemeColors } from "../getHexFromThemeColors"

const themeColors = {
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
}

describe("getHexFromThemeColors", () => {
  it("returns provided brand colours as hex values", () => {
    const colors = getHexFromThemeColors(themeColors)

    expect(colors.brand?.canvas.inverse).toBe("#123456")
    expect(colors.brand?.canvas.default).toBe("#f0f0f0")
    expect(colors.brand?.canvas.alt).toBe("#d0d0d0")
  })

  it("returns undefined brand colours when theme colours are omitted", () => {
    const colors = getHexFromThemeColors()

    expect(colors.brand).toBeUndefined()
  })

  it("does not return CSS variable references", () => {
    const colors = getHexFromThemeColors(themeColors)

    const values = [
      ...Object.values(colors.brand!.canvas),
      ...Object.values(colors.brand!.interaction),
      colors.base.canvas,
      colors.base.content.strong,
      colors.base.divider.medium,
    ]

    for (const value of values) {
      expect(value).not.toMatch(/^var\(/)
      expect(value).toMatch(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)
    }
  })
})
