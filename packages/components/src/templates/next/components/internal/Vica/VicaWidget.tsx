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
    />
  )
}
