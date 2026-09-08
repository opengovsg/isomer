import type { IsomerSiteThemeProps } from "~/types"
import { colors } from "~/presets/next/colors"

export const getVicaColorAttributes = (
  themeColors?: IsomerSiteThemeProps["colors"],
) => {
  const brand = themeColors?.brand
  const attributes: Record<string, string> = {
    "app-foreground-color": colors.base.canvas.DEFAULT,
    "app-quick-reply-button-background-color": colors.base.canvas.DEFAULT,
    "app-auto-complete-foreground-color": colors.base.content.strong,
    "app-auto-complete-divider-color": colors.base.divider.medium,
    "app-recommendations-foreground-color": colors.base.content.strong,
  }

  if (brand) {
    attributes["app-color"] = brand.canvas.inverse
    attributes["app-button-border-color"] = brand.canvas.inverse
    attributes["app-canvas-background-color"] = brand.canvas.default
    attributes["app-auto-complete-background-color"] = brand.canvas.default
    attributes["app-auto-complete-hover-color"] = brand.canvas.alt
    attributes["app-recommendations-background-color"] = brand.canvas.default
    attributes["app-recommendations-hover-color"] = brand.canvas.alt
  }

  return attributes
}
