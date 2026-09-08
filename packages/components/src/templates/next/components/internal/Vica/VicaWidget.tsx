import type { VicaWidgetProps } from "~/interfaces"
import { colors } from "~/presets/next/colors"
import { getReferenceLinkHref } from "~/utils/getReferenceLinkHref"

import { VicaWidgetClient } from "./VicaWidgetClient"

export const VicaWidget = ({
  site,
  themeColors,
  "app-icon": appIcon,
  ...rest
}: VicaWidgetProps) => {
  const brand = themeColors?.brand

  return (
    <VicaWidgetClient
      app-icon={
        appIcon
          ? getReferenceLinkHref(appIcon, site.siteMapArray, site.assetsBaseUrl)
          : undefined
      }
      {...rest}
      // We ignore config passed in from DB and manually overwrite
      // the following attributes to ensure consistency and best brand appearance.
      // VICA only accepts literal hex values — not CSS variables or design tokens.
      app-font-family="Inter, system-ui, sans-serif"
      app-foreground-color={colors.base.canvas.DEFAULT}
      app-quick-reply-button-background-color={colors.base.canvas.DEFAULT}
      app-auto-complete-foreground-color={colors.base.content.strong}
      app-auto-complete-divider-color={colors.base.divider.medium}
      app-recommendations-foreground-color={colors.base.content.strong}
      {...(brand && {
        "app-color": brand.canvas.inverse,
        "app-button-border-color": brand.canvas.inverse,
        "app-canvas-background-color": brand.canvas.default,
        "app-auto-complete-background-color": brand.canvas.default,
        "app-auto-complete-hover-color": brand.canvas.alt,
        "app-recommendations-background-color": brand.canvas.default,
        "app-recommendations-hover-color": brand.canvas.alt,
      })}
    />
  )
}
