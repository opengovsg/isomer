import omit from "lodash/omit"

import type {
  ContactInformationProps,
  DgsContactInformationProps,
  NativeContactInformationProps,
} from "~/interfaces"
import { DATA_SOURCE_TYPE } from "~/interfaces/integration"
import { getReferenceLinkHref } from "~/utils"
import { DgsContactInformation, NativeContactInformation } from "./components"

const ContactInformation = (props: ContactInformationProps) => {
  const uiProps = {
    ...omit(props, ["url", "site"]),
    referenceLinkHref: getReferenceLinkHref(
      props.url,
      props.site.siteMap,
      props.site.assetsBaseUrl,
    ),
  }

  switch (props.dataSource?.type) {
    case DATA_SOURCE_TYPE.dgs:
      return (
        <DgsContactInformation {...(uiProps as DgsContactInformationProps)} />
      )
    default:
      return (
        <NativeContactInformation
          {...(uiProps as NativeContactInformationProps)}
        />
      )
  }
}

export default ContactInformation
