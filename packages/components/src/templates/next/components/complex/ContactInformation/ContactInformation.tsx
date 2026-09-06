import type {
  ContactInformationProps,
  NativeContactInformationProps,
} from "~/interfaces"
import { omit } from "lodash-es"
import { DATA_SOURCE_TYPE } from "~/interfaces/integration"
import { getReferenceLinkHref } from "~/utils/getReferenceLinkHref"

import { DgsContactInformation } from "./DgsContactInformation"
import { NativeContactInformation } from "./NativeContactInformation"

export const ContactInformation = ({
  dataSource,
  ...rest
}: ContactInformationProps) => {
  const uiProps = {
    ...omit(rest, ["url", "site"]),
    referenceLinkHref: getReferenceLinkHref(
      rest.url,
      rest.site.siteMapArray,
      rest.site.assetsBaseUrl,
    ),
  }

  // SAFETY: native branch receives native-shaped props after dataSource routing above
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- native contact props omit url/site after omit()
  const nativeProps = uiProps as NativeContactInformationProps & {
    referenceLinkHref?: string
  }

  // For backward compatibility, where dataSource is not provided,
  if (!dataSource) {
    return <NativeContactInformation {...nativeProps} />
  }

  const { type } = dataSource
  switch (type) {
    case DATA_SOURCE_TYPE.native: {
      return <NativeContactInformation {...nativeProps} />
    }
    case DATA_SOURCE_TYPE.dgs: {
      return <DgsContactInformation dataSource={dataSource} {...uiProps} />
    }
    default: {
      const _exhaustiveCheck: never = type
      return _exhaustiveCheck
    }
  }
}
