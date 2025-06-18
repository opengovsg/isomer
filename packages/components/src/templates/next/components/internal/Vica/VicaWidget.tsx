import type { VicaWidgetProps } from "~/interfaces"
import { colors } from "~/presets/next/colors"
import { getReferenceLinkHref } from "~/utils"
import { VicaWidgetClient } from "./VicaWidgetClient"

export const VicaWidget = (props: VicaWidgetProps) => {
  const { site, "app-icon": appIcon, ...rest } = props
  return (
    <VicaWidgetClient
      environment={site.environment}
      app-icon={
        appIcon
          ? getReferenceLinkHref(appIcon, site.siteMap, site.assetsBaseUrl)
          : undefined
      }
      {...rest}
      // We ignore config passed in from DB and manually overwrite
      // the following attributes to ensure consistency and best brand appearance
      app-font-family="Inter, system-ui, sans-serif"
      app-foreground-color={colors.base.canvas.DEFAULT}
      app-color={colors.brand.canvas.inverse}
      app-button-border-color={colors.brand.canvas.inverse}
      app-canvas-background-color={colors.brand.canvas.DEFAULT}
      app-quick-reply-button-background-color={colors.base.canvas.DEFAULT}
      app-auto-complete-background-color={colors.brand.canvas.DEFAULT}
      app-auto-complete-hover-color={colors.brand.canvas.alt}
      app-auto-complete-foreground-color={colors.base.content.strong}
      app-auto-complete-divider-color={colors.base.divider.medium}
      app-recommendations-background-color={colors.brand.canvas.DEFAULT}
      app-recommendations-hover-color={colors.brand.canvas.alt}
      app-recommendations-foreground-color={colors.base.content.strong}
    />
  )
}
