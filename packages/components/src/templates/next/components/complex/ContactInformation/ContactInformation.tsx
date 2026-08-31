import type { ContactInformationProps } from "~/interfaces"
import { omit } from "lodash-es"
import { DATA_SOURCE_TYPE } from "~/interfaces/integration"
import { getReferenceLinkHref } from "~/utils/getReferenceLinkHref"

import { type ContentBlockIndexProps } from "../../../render/contentBlockIndex"
import { DgsContactInformation } from "./DgsContactInformation"
import { NativeContactInformation } from "./NativeContactInformation"

type ContactInformationRenderProps = ContactInformationProps &
  ContentBlockIndexProps

export const ContactInformation = ({
  dataSource,
  contentBlockIndex,
  ...rest
}: ContactInformationRenderProps) => {
  const uiProps = {
    ...omit(rest, ["url", "site"]),
    referenceLinkHref: getReferenceLinkHref(
      rest.url,
      rest.site.siteMapArray,
      rest.site.assetsBaseUrl,
    ),
  }

  // For backward compatibility, where dataSource is not provided,
  if (!dataSource) {
    return (
      <NativeContactInformation
        {...uiProps}
        contentBlockIndex={contentBlockIndex}
      />
    )
  }

  const { type } = dataSource
  switch (type) {
    case DATA_SOURCE_TYPE.native:
      return (
        <NativeContactInformation
          {...uiProps}
          contentBlockIndex={contentBlockIndex}
        />
      )
    case DATA_SOURCE_TYPE.dgs:
      return (
        <DgsContactInformation
          dataSource={dataSource}
          {...uiProps}
          contentBlockIndex={contentBlockIndex}
        />
      )
    default:
      const _exhaustiveCheck: never = type
      return _exhaustiveCheck
  }
}
