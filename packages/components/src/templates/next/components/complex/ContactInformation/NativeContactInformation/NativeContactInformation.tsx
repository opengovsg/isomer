import type { NativeContactInformationProps } from "~/interfaces/complex/ContactInformation/ContactInformation"

import { type ContentBlockIndexProps } from "../../../../render/contentBlockIndex"
import { ContactInformationUI } from "../components"

type NativeContactInformationRenderProps = NativeContactInformationProps &
  ContentBlockIndexProps

export const NativeContactInformation = ({
  dataSource: _dataSource,
  contentBlockIndex,
  ...rest
}: NativeContactInformationRenderProps) => {
  return (
    <ContactInformationUI {...rest} contentBlockIndex={contentBlockIndex} />
  )
}
