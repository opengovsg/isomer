import type { DynamicDataBannerProps } from "~/interfaces"
import { getReferenceLinkHref, getTextAsHtml } from "~/utils"
import BaseParagraph from "../../internal/BaseParagraph/BaseParagraph"
import { DynamicDataBannerClient } from "./DynamicDataBannerClient"
import { getDynamicDataBannerClassNames } from "./styles"

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
  // Compute on server so tv/twMerge are not bundled on the client
  const classNames = getDynamicDataBannerClassNames()

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
          LinkComponent={LinkComponent}
        />
      }
      classNames={classNames}
    />
  )
}
