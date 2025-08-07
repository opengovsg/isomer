import type { NativeContactInformationProps } from "~/interfaces/complex/ContactInformation"
import { ContactInformationUI } from "./ContactInformationUI"

export const NativeContactInformation = ({
  dataSource: _dataSource,
  ...rest
}: NativeContactInformationProps) => {
  return <ContactInformationUI {...rest} />
}
