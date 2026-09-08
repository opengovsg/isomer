import type { IsomerSiteThemeProps } from "~/types"

type ThemeColorParts = {
  brand?: IsomerSiteThemeProps["colors"]["brand"]
  base?: IsomerSiteThemeProps["colors"]["base"]
}

export const getVicaColorAttributes = ({ brand, base }: ThemeColorParts) => {
  const attributes: Record<string, string> = {}

  if (base) {
    attributes["app-foreground-color"] = base.canvas.default
    attributes["app-quick-reply-button-background-color"] = base.canvas.default
    attributes["app-auto-complete-foreground-color"] = base.content.strong
    attributes["app-auto-complete-divider-color"] = base.divider.medium
    attributes["app-recommendations-foreground-color"] = base.content.strong
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
