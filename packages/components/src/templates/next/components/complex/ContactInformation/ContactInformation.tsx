import omit from "lodash/omit"

import type { ContactInformationProps } from "~/interfaces"
import { DATA_SOURCE_TYPE } from "~/interfaces/integration"
import { getReferenceLinkHref } from "~/utils"
import { DgsContactInformation } from "./DgsContactInformation"
import { NativeContactInformation } from "./NativeContactInformation"

const ContactInformation = ({
  dataSource,
  ...rest
}: ContactInformationProps) => {
  const uiProps = {
    ...omit(rest, ["url", "site"]),
    referenceLinkHref: getReferenceLinkHref(
      rest.url,
      rest.site.siteMap,
      rest.site.assetsBaseUrl,
    ),
  }

  // For backward compatibility, where dataSource is not provided,
  if (!dataSource) {
    return <NativeContactInformation {...uiProps} />
  }

  const { type } = dataSource
  switch (type) {
    case DATA_SOURCE_TYPE.native:
      return <NativeContactInformation {...uiProps} />
    case DATA_SOURCE_TYPE.dgs:
      return <DgsContactInformation dataSource={dataSource} {...uiProps} />
    default:
      const _exhaustiveCheck: never = type
      return _exhaustiveCheck
  }
}

export default ContactInformation
