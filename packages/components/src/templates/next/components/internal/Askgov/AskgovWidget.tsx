"use client"

import type { AskgovWidgetProps } from "~/interfaces"
import { useInteractionScriptLoader } from "~/hooks/useInteractionScriptLoader"

// Reference: https://github.com/opengovsg/askgov-widget
export const AskgovWidget = ({
  environment,
  ...askgovProps
}: AskgovWidgetProps) => {
  const scriptUrl =
    environment === "production"
      ? "https://script.ask.gov.sg/widget.js"
      : "https://script-staging.ask.gov.sg/widget.js"

  useInteractionScriptLoader({ src: scriptUrl })

  return <div id="askgov-widget" {...askgovProps} />
}
