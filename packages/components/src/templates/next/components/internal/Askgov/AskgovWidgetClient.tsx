import type { AskgovWidgetClientProps } from "~/interfaces"
import { useInteractionScriptLoader } from "~/hooks/useInteractionScriptLoader"
import { island } from "~/islands/island"

// Reference: https://github.com/opengovsg/askgov-next/tree/main/apps/widget
const AskgovWidgetClientComponent = ({
  scriptUrl,
  ...askgovProps
}: AskgovWidgetClientProps) => {
  useInteractionScriptLoader({ src: scriptUrl })

  return <div id="askgov-widget" {...askgovProps} />
}

export const AskgovWidgetClient = island(
  "AskgovWidgetClient",
  AskgovWidgetClientComponent,
  { hydrate: "idle" },
)
