import type { DynamicDataBannerProps } from "~/interfaces"
import { getReferenceLinkHref, getTextAsHtml } from "~/utils"
import BaseParagraph from "../../internal/BaseParagraph/BaseParagraph"
import { DynamicDataBannerClient } from "./DynamicDataBannerClient"

export const DynamicDataBanner = ({
  apiEndpoint,
  title,
  data,
  url,
  label,
  errorMessage,
  site,
  LinkComponent,
}: DynamicDataBannerProps) => {
  return (
    <DynamicDataBannerClient
      apiEndpoint={apiEndpoint}
      title={title}
      data={data}
      url={getReferenceLinkHref(url, site.siteMap, site.assetsBaseUrl)}
      label={label}
      errorMessageBaseParagraph={
        <BaseParagraph
          content={getTextAsHtml({
            site,
            content: errorMessage,
          })}
          className="prose-label-sm-medium [&:not(:first-child)]:mt-0 [&:not(:last-child)]:mb-0"
          site={site}
          LinkComponent={LinkComponent}
        />
      }
    />
  )
}
