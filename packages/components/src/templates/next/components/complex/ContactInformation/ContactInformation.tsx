import type {
  ContactInformationProps,
  DgsContactInformationProps,
  NativeContactInformationProps,
} from "~/interfaces"
import { DATA_SOURCE_TYPE } from "~/interfaces/dataSource"
import { DgsContactInformation } from "./DgsContactInformation"
import { NativeContactInformation } from "./NativeContactInformation"

const ContactInformation = (props: ContactInformationProps) => {
  switch (props.dataSource?.type) {
    case DATA_SOURCE_TYPE.dgs:
      return (
        <DgsContactInformation {...(props as DgsContactInformationProps)} />
      )
    default:
      return (
        <NativeContactInformation
          {...(props as NativeContactInformationProps)}
        />
      )
  }
}

export default ContactInformation
