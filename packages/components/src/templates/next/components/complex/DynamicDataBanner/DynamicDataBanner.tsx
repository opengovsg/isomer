import type { DynamicDataBannerProps } from "~/interfaces"
import { getReferenceLinkHref } from "~/utils/getReferenceLinkHref"
import { getTextAsHtml } from "~/utils/getTextAsHtml"

import type { ContentBlockIndexProps } from "../../../render/contentBlockIndex"
import { BaseParagraph } from "../../internal/BaseParagraph"
import { DynamicDataBannerClient } from "./DynamicDataBannerClient"

type DynamicDataBannerRenderProps = DynamicDataBannerProps &
  ContentBlockIndexProps

export const DynamicDataBanner = ({
  apiEndpoint,
  title,
  data,
  url,
  label,
  errorMessage,
  site,
  contentBlockIndex,
}: DynamicDataBannerRenderProps) => {
  return (
    <DynamicDataBannerClient
      apiEndpoint={apiEndpoint}
      title={title}
      data={data}
      url={getReferenceLinkHref(url, site.siteMapArray, site.assetsBaseUrl)}
      label={label}
      contentBlockIndex={contentBlockIndex}
      errorMessageBaseParagraph={
        <BaseParagraph
          content={getTextAsHtml({
            site,
            content: errorMessage,
          })}
          className="prose-label-sm-medium [&:not(:first-child)]:mt-0 [&:not(:last-child)]:mb-0"
        />
      }
    />
  )
}
