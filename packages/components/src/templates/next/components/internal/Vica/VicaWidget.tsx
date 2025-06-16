import twColors from "tailwindcss/colors"

import type { VicaWidgetProps } from "~/interfaces"
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
      app-foreground-color="#FFFFFF" // hardcoded to be white for all agencies
      app-color="var(--color-brand-canvas-inverse)"
      app-button-border-color="var(--color-brand-canvas-inverse)"
      app-canvas-background-color="var(--color-brand-canvas-default)"
      app-auto-complete-background-color="var(--color-brand-canvas-default)"
      app-auto-complete-hover-color="var(--color-brand-canvas-alt)"
      app-auto-complete-foreground-color={twColors.gray["900"]}
      app-auto-complete-divider-color={twColors.gray["500"]}
      app-recommendations-background-color="var(--color-brand-canvas-default)"
      app-recommendations-hover-color="var(--color-brand-canvas-alt)"
      app-recommendations-foreground-color={twColors.gray["900"]}
    />
  )
}
