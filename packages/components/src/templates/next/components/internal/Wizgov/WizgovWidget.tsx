import type { WizgovWidgetProps } from "~/interfaces"
import { WizgovWidgetClient } from "./WizgovWidgetClient"

// Reference: https://github.com/opengovsg/wizgov
export const WizgovWidget = (props: WizgovWidgetProps) => {
  const { site, ...rest } = props

  const scriptUrl =
    site.environment === "production"
      ? "https://script.wiz.gov.sg/widget.js"
      : "https://script-staging.wiz.gov.sg/widget.js"

  return <WizgovWidgetClient scriptUrl={scriptUrl} {...rest} />
}
