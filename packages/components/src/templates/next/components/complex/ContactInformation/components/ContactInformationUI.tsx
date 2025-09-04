import type { ContactInformationUIProps } from "~/interfaces"
import { getTailwindVariantLayout } from "~/utils"
import { DefaultContactInformationUI } from "./DefaultContactInformationUI"
import { HomepageContactInformationUI } from "./HomepageContactInformationUI"

export const ContactInformationUI = (props: ContactInformationUIProps) => {
  const simplifiedLayout = getTailwindVariantLayout(props.layout)

  switch (simplifiedLayout) {
    case "default":
      return <DefaultContactInformationUI {...props} />
    case "homepage":
      return <HomepageContactInformationUI {...props} />
    default:
      const _exhaustiveCheck: never = simplifiedLayout
      return null
  }
}
