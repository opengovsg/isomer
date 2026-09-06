import type { ContactInformationUIProps } from "~/interfaces"
import { getTailwindVariantLayout } from "~/utils/getTailwindVariantLayout"

import { DefaultContactInformationUI } from "./DefaultContactInformationUi"
import { HomepageContactInformationUI } from "./HomepageContactInformationUi"

export const ContactInformationUI = (props: ContactInformationUIProps) => {
  const simplifiedLayout = getTailwindVariantLayout(props.layout)

  switch (simplifiedLayout) {
    case "default": {
      return <DefaultContactInformationUI {...props} />
    }
    case "homepage": {
      return <HomepageContactInformationUI {...props} />
    }
    default: {
      const _exhaustiveCheck: never = simplifiedLayout
      return _exhaustiveCheck
    }
  }
}
