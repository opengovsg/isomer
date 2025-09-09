import omit from "lodash/omit"

import type {
  ContactInformationProps,
  DgsContactInformationProps,
  NativeContactInformationProps,
} from "~/interfaces"
import { DATA_SOURCE_TYPE } from "~/interfaces/integration"
import { getReferenceLinkHref } from "~/utils"
import { DgsContactInformation } from "./DgsContactInformation"
import { NativeContactInformation } from "./NativeContactInformation"

const ContactInformation = (props: ContactInformationProps) => {
  const uiProps = {
    ...omit(props, ["url", "site"]),
    referenceLinkHref: getReferenceLinkHref(
      props.url,
      props.site.siteMap,
      props.site.assetsBaseUrl,
    ),
  }

  if (!props.dataSource) {
    return (
      <NativeContactInformation
        {...(uiProps as NativeContactInformationProps)}
      />
    )
  }

  const { type } = props.dataSource

  switch (type) {
    case DATA_SOURCE_TYPE.native:
      return (
        <NativeContactInformation
          {...(uiProps as NativeContactInformationProps)}
        />
      )
    case DATA_SOURCE_TYPE.dgs:
      return (
        <DgsContactInformation {...(uiProps as DgsContactInformationProps)} />
      )
    default:
      const _exhaustiveCheck: never = type
      return _exhaustiveCheck
  }
}

export default ContactInformation
