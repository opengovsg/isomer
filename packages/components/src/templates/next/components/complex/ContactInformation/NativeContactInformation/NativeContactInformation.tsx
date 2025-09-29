import type { NativeContactInformationProps } from "~/interfaces/complex/ContactInformation"
import { ContactInformationUI } from "../components"

export const NativeContactInformation = ({
  dataSource: _dataSource,
  ...rest
}: NativeContactInformationProps) => {
  return <ContactInformationUI {...rest} />
}
