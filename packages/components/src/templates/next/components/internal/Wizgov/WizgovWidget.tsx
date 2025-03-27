import type { WizgovWidgetProps } from "~/interfaces"
import { WizgovWidgetClient } from "./WizgovWidgetClient"

// Reference: https://github.com/opengovsg/wizgov
export const WizgovWidget = ({ environment, ...rest }: WizgovWidgetProps) => {
  return (
    <WizgovWidgetClient
      scriptUrl={
        environment === "production"
          ? "https://script.wiz.gov.sg/widget.js"
          : "https://script-staging.wiz.gov.sg/widget.js"
      }
      {...rest}
    />
  )
}
