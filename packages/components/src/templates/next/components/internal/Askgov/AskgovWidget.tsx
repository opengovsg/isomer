import type { AskgovWidgetProps } from "~/interfaces"

import { AskgovWidgetClient } from "./AskgovWidgetClient"

export const AskgovWidget = ({
  environment,
  ...askgovProps
}: AskgovWidgetProps) => {
  return (
    <AskgovWidgetClient
      scriptUrl={
        environment === "production"
          ? "https://script.ask.gov.sg/widget.js"
          : "https://script-staging.ask.gov.sg/widget.js"
      }
      {...askgovProps}
    />
  )
}
