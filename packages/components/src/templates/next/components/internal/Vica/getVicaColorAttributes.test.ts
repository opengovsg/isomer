import { describe, expect, it } from "vitest"
import { colors } from "~/presets/next/colors"

import { getVicaColorAttributes } from "./getVicaColorAttributes"

const brand = {
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
}

describe("getVicaColorAttributes", () => {
  it("returns brand and preset base attributes", () => {
    expect(getVicaColorAttributes({ brand })).toEqual({
      "app-foreground-color": colors.base.canvas.DEFAULT,
      "app-quick-reply-button-background-color": colors.base.canvas.DEFAULT,
      "app-auto-complete-foreground-color": colors.base.content.strong,
      "app-auto-complete-divider-color": colors.base.divider.medium,
      "app-recommendations-foreground-color": colors.base.content.strong,
      "app-color": "#123456",
      "app-button-border-color": "#123456",
      "app-canvas-background-color": "#f0f0f0",
      "app-auto-complete-background-color": "#f0f0f0",
      "app-auto-complete-hover-color": "#d0d0d0",
      "app-recommendations-background-color": "#f0f0f0",
      "app-recommendations-hover-color": "#d0d0d0",
    })
  })

  it("returns only preset base attributes when brand is omitted", () => {
    expect(getVicaColorAttributes({})).toEqual({
      "app-foreground-color": colors.base.canvas.DEFAULT,
      "app-quick-reply-button-background-color": colors.base.canvas.DEFAULT,
      "app-auto-complete-foreground-color": colors.base.content.strong,
      "app-auto-complete-divider-color": colors.base.divider.medium,
      "app-recommendations-foreground-color": colors.base.content.strong,
    })
  })
})
