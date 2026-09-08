import type { IsomerSiteThemeProps } from "~/types"

// Default brand palette — matches packages/components/src/index.css fallbacks.
const DEFAULT_BRAND_COLORS: IsomerSiteThemeProps["colors"]["brand"] = {
  canvas: {
    default: "#e6ecef",
    alt: "#bfcfd7",
    backdrop: "#80a0af",
    inverse: "#00405f",
  },
  interaction: {
    default: "#00405f",
    hover: "#002e44",
    pressed: "#00283b",
  },
}

// Base palette hex values — mirrors presets/next/colors.ts without CSS variables.
const DEFAULT_BASE_COLORS = {
  canvas: "#ffffff",
  content: {
    strong: "#111827",
  },
  divider: {
    medium: "#d1d5db",
  },
} as const

export type HexThemeColors = {
  brand: IsomerSiteThemeProps["colors"]["brand"]
  base: {
    canvas: string
    content: {
      strong: string
    }
    divider: {
      medium: string
    }
  }
}

export const getHexFromThemeColors = (
  themeColors?: IsomerSiteThemeProps["colors"],
): HexThemeColors => ({
  brand: themeColors?.brand ?? DEFAULT_BRAND_COLORS,
  base: DEFAULT_BASE_COLORS,
})
