import type { VicaWidgetProps } from "~/interfaces"
import { getHexFromThemeColors } from "~/utils/getHexFromThemeColors"
import { getReferenceLinkHref } from "~/utils/getReferenceLinkHref"

import { VicaWidgetClient } from "./VicaWidgetClient"

export const VicaWidget = ({
  site,
  themeColors,
  "app-icon": appIcon,
  ...rest
}: VicaWidgetProps) => {
  const { brand, base } = getHexFromThemeColors(themeColors)

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
      app-foreground-color={base.canvas}
      app-color={brand.canvas.inverse}
      app-button-border-color={brand.canvas.inverse}
      app-canvas-background-color={brand.canvas.default}
      app-quick-reply-button-background-color={base.canvas}
      app-auto-complete-background-color={brand.canvas.default}
      app-auto-complete-hover-color={brand.canvas.alt}
      app-auto-complete-foreground-color={base.content.strong}
      app-auto-complete-divider-color={base.divider.medium}
      app-recommendations-background-color={brand.canvas.default}
      app-recommendations-hover-color={brand.canvas.alt}
      app-recommendations-foreground-color={base.content.strong}
    />
  )
}
