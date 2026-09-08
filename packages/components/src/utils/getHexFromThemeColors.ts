import type { IsomerSiteThemeProps } from "~/types"

export const getHexFromThemeColors = (
  themeColors?: IsomerSiteThemeProps["colors"],
) => ({
  brand: themeColors?.brand,
  base: themeColors?.base,
})
