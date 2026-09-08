import type { IsomerSiteThemeProps } from "~/types"

// Base palette hex values — mirrors presets/next/colors.ts without CSS variables.
const BASE_COLORS = {
  canvas: "#ffffff",
  content: {
    strong: "#111827",
  },
  divider: {
    medium: "#d1d5db",
  },
} as const

export const getHexFromThemeColors = (
  themeColors?: IsomerSiteThemeProps["colors"],
) => ({
  brand: themeColors?.brand,
  base: BASE_COLORS,
})
