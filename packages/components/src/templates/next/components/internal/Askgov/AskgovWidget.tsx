"use client"

import type { AskgovWidgetProps } from "~/interfaces"

// Reference: https://github.com/opengovsg/askgov-widget
export const AskgovWidget = ({
  environment,
  ScriptComponent,
  ...askgovProps
}: AskgovWidgetProps) => {
  const scriptUrl =
    environment === "production"
      ? "https://script.ask.gov.sg/widget.js"
      : "https://script-staging.ask.gov.sg/widget.js"

  return (
    <>
      <ScriptComponent src={scriptUrl} strategy="lazyOnload" />
      <div id="askgov-widget" {...askgovProps} />
    </>
  )
}
