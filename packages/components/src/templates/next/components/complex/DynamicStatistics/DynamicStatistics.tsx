import type { DynamicStatisticsProps } from "~/interfaces"
import { getReferenceLinkHref } from "~/utils"
import { DynamicStatisticsClient } from "./DynamicStatisticsClient"

export const DynamicStatistics = ({
  apiEndpoint,
  title,
  statistics,
  url,
  label,
  site,
  LinkComponent,
}: DynamicStatisticsProps) => {
  return (
    <DynamicStatisticsClient
      apiEndpoint={apiEndpoint}
      title={title}
      statistics={statistics}
      url={getReferenceLinkHref(url, site.siteMap, site.assetsBaseUrl)}
      label={label}
      LinkComponent={LinkComponent}
    />
  )
}
