import type { VicaProps } from "~/interfaces"
import { getReferenceLinkHref } from "~/utils"
import { VicaWidgetClient } from "./VicaWidgetClient"

export const VicaWidget = (props: VicaProps) => {
  const { site, "app-icon": appIcon, ...rest } = props
  return (
    <VicaWidgetClient
      app-icon={
        appIcon
          ? getReferenceLinkHref(appIcon, site.siteMap, site.assetsBaseUrl)
          : undefined
      }
      {...rest}
    />
  )
}
