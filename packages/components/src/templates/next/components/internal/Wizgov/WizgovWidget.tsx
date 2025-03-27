import type { WizgovWidgetProps } from "~/interfaces"

// Reference: https://github.com/opengovsg/wizgov
export const WizgovWidget = ({
  site,
  ScriptComponent = "script",
  ...rest
}: WizgovWidgetProps) => {
  return (
    <>
      <div id="wizgov-widget" data-agency={rest["data-agency"]} />
      <ScriptComponent
        src={
          site.environment === "production"
            ? "https://script.wiz.gov.sg/widget.js"
            : "https://script-staging.wiz.gov.sg/widget.js"
        }
      />
    </>
  )
}
