import type { VicaWidgetProps } from "~/interfaces"
import { getReferenceLinkHref } from "~/utils/getReferenceLinkHref"

import { getVicaThemeColors } from "./getVicaThemeColors"
import { VicaWidgetClient } from "./VicaWidgetClient"

export const VicaWidget = ({
  site,
  themeColors,
  "app-icon": appIcon,
  ...rest
}: VicaWidgetProps) => {
  const vicaColors = getVicaThemeColors(themeColors)

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
      app-foreground-color={vicaColors.foreground}
      app-color={vicaColors.brand}
      app-button-border-color={vicaColors.buttonBorder}
      app-canvas-background-color={vicaColors.canvasBackground}
      app-quick-reply-button-background-color={
        vicaColors.quickReplyButtonBackground
      }
      app-auto-complete-background-color={vicaColors.autoCompleteBackground}
      app-auto-complete-hover-color={vicaColors.autoCompleteHover}
      app-auto-complete-foreground-color={vicaColors.autoCompleteForeground}
      app-auto-complete-divider-color={vicaColors.autoCompleteDivider}
      app-recommendations-background-color={
        vicaColors.recommendationsBackground
      }
      app-recommendations-hover-color={vicaColors.recommendationsHover}
      app-recommendations-foreground-color={
        vicaColors.recommendationsForeground
      }
    />
  )
}
