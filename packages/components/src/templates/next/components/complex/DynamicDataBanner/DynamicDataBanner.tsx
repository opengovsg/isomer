import type { DynamicDataBannerProps } from "~/interfaces"
import { getReferenceLinkHref } from "~/utils"
import { DynamicDataBannerClient } from "./DynamicDataBannerClient"

export const DynamicDataBanner = ({
  apiEndpoint,
  title,
  statistics,
  url,
  label,
  site,
  LinkComponent,
}: DynamicDataBannerProps) => {
  return (
    <DynamicDataBannerClient
      apiEndpoint={apiEndpoint}
      title={title}
      statistics={statistics}
      url={getReferenceLinkHref(url, site.siteMap, site.assetsBaseUrl)}
      label={label}
      LinkComponent={LinkComponent}
    />
  )
}
