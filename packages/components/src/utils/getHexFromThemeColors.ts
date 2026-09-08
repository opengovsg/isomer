import type { IsomerSiteThemeProps } from "~/types"
import { baseHexColors } from "~/presets/next/colors"

export const getHexFromThemeColors = (
  themeColors?: IsomerSiteThemeProps["colors"],
) => ({
  brand: themeColors?.brand,
  base: baseHexColors,
})
