import type { VicaWidgetProps } from "~/interfaces"
import { getHexFromThemeColors } from "~/utils/getHexFromThemeColors"
import { getReferenceLinkHref } from "~/utils/getReferenceLinkHref"

import { getVicaColorAttributes } from "./getVicaColorAttributes"
import { VicaWidgetClient } from "./VicaWidgetClient"

export const VicaWidget = ({
  site,
  themeColors,
  "app-icon": appIcon,
  ...rest
}: VicaWidgetProps) => {
  const themeColorAttributes = getVicaColorAttributes(
    getHexFromThemeColors(themeColors),
  )

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
      {...themeColorAttributes}
    />
  )
}
