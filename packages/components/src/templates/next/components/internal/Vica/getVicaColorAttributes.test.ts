import { describe, expect, it } from "vitest"

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

const base = {
  canvas: {
    default: "#fefefe",
  },
  content: {
    strong: "#222222",
  },
  divider: {
    medium: "#cccccc",
  },
}

describe("getVicaColorAttributes", () => {
  it("returns brand and base attributes when both are provided", () => {
    expect(getVicaColorAttributes({ brand, base })).toEqual({
      "app-foreground-color": "#fefefe",
      "app-color": "#123456",
      "app-button-border-color": "#123456",
      "app-canvas-background-color": "#f0f0f0",
      "app-quick-reply-button-background-color": "#fefefe",
      "app-auto-complete-background-color": "#f0f0f0",
      "app-auto-complete-hover-color": "#d0d0d0",
      "app-auto-complete-foreground-color": "#222222",
      "app-auto-complete-divider-color": "#cccccc",
      "app-recommendations-background-color": "#f0f0f0",
      "app-recommendations-hover-color": "#d0d0d0",
      "app-recommendations-foreground-color": "#222222",
    })
  })

  it("returns only base attributes when brand is omitted", () => {
    expect(getVicaColorAttributes({ base })).toEqual({
      "app-foreground-color": "#fefefe",
    })
  })

  it("returns only brand attributes when base is omitted", () => {
    expect(getVicaColorAttributes({ brand })).toEqual({
      "app-color": "#123456",
      "app-button-border-color": "#123456",
      "app-canvas-background-color": "#f0f0f0",
    })
  })

  it("returns an empty object when theme colours are omitted", () => {
    expect(getVicaColorAttributes({})).toEqual({})
  })
})
