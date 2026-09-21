import type { NativeContactInformationProps } from "~/interfaces/complex/ContactInformation/ContactInformation"

import { type ContentBlockIndexProps } from "../../../../render/contentBlockIndex"
import { ContactInformationUI } from "../components"

export const NativeContactInformation = ({
  dataSource: _dataSource,
  contentBlockIndex,
  ...rest
}: NativeContactInformationProps & ContentBlockIndexProps) => {
  return (
    <ContactInformationUI {...rest} contentBlockIndex={contentBlockIndex} />
  )
}
