import type { ContactInformationUIProps } from "~/interfaces"
import { getTailwindVariantLayout } from "~/utils/getTailwindVariantLayout"

import { type ContentBlockIndexProps } from "../../../../render/contentBlockIndex"
import { DefaultContactInformationUI } from "./DefaultContactInformationUI"
import { HomepageContactInformationUI } from "./HomepageContactInformationUI"

export const ContactInformationUI = (
  props: ContactInformationUIProps & ContentBlockIndexProps,
) => {
  const simplifiedLayout = getTailwindVariantLayout(props.layout)

  switch (simplifiedLayout) {
    case "default":
      return <DefaultContactInformationUI {...props} />
    case "homepage":
      return <HomepageContactInformationUI {...props} />
    default:
      const _exhaustiveCheck: never = simplifiedLayout
      return _exhaustiveCheck
  }
}
