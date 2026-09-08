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
const BASE_COLORS = {
  canvas: "#ffffff",
  contentStrong: "#111827",
  dividerMedium: "#d1d5db",
} as const

export type VicaThemeColors = {
  foreground: string
  brand: string
  buttonBorder: string
  canvasBackground: string
  quickReplyButtonBackground: string
  autoCompleteBackground: string
  autoCompleteHover: string
  autoCompleteForeground: string
  autoCompleteDivider: string
  recommendationsBackground: string
  recommendationsHover: string
  recommendationsForeground: string
}

export const getVicaThemeColors = (
  themeColors?: IsomerSiteThemeProps["colors"],
): VicaThemeColors => {
  const brand = themeColors?.brand ?? DEFAULT_BRAND_COLORS

  return {
    foreground: BASE_COLORS.canvas,
    brand: brand.canvas.inverse,
    buttonBorder: brand.canvas.inverse,
    canvasBackground: brand.canvas.default,
    quickReplyButtonBackground: BASE_COLORS.canvas,
    autoCompleteBackground: brand.canvas.default,
    autoCompleteHover: brand.canvas.alt,
    autoCompleteForeground: BASE_COLORS.contentStrong,
    autoCompleteDivider: BASE_COLORS.dividerMedium,
    recommendationsBackground: brand.canvas.default,
    recommendationsHover: brand.canvas.alt,
    recommendationsForeground: BASE_COLORS.contentStrong,
  }
}
