import type { VicaWidgetProps } from "~/interfaces"
import { getReferenceLinkHref } from "~/utils/getReferenceLinkHref"

import { VicaWidgetClient } from "./VicaWidgetClient"

export const VicaWidget = ({
  site,
  "app-icon": appIcon,
  ...rest
}: VicaWidgetProps) => {
  return (
    <VicaWidgetClient
      app-icon={
        appIcon
          ? getReferenceLinkHref(appIcon, site.siteMapArray, site.assetsBaseUrl)
          : undefined
      }
      {...rest}
      // We ignore config passed in from DB and manually overwrite
      // the following attributes to ensure consistency and best brand appearance
      app-font-family="Inter, system-ui, sans-serif"
      app-foreground-color="var(--color-base-canvas)"
      app-color="var(--color-brand-canvas-inverse)"
      app-button-border-color="var(--color-brand-canvas-inverse)"
      app-canvas-background-color="var(--color-brand-canvas-default)"
      app-quick-reply-button-background-color="var(--color-base-canvas)"
      app-auto-complete-background-color="var(--color-brand-canvas-default)"
      app-auto-complete-hover-color="var(--color-brand-canvas-alt)"
      app-auto-complete-foreground-color="var(--color-base-content-strong)"
      app-auto-complete-divider-color="var(--color-base-divider-medium)"
      app-recommendations-background-color="var(--color-brand-canvas-default)"
      app-recommendations-hover-color="var(--color-brand-canvas-alt)"
      app-recommendations-foreground-color="var(--color-base-content-strong)"
    />
  )
}
