"use client"

import type { VicaWidgetClientProps } from "~/interfaces"
import { useInteractionScriptLoader } from "~/hooks/useInteractionScriptLoader"
import { island } from "~/islands/island"

const VicaWidgetClientComponent = ({
  scriptUrl,
  ...vicaProps
}: VicaWidgetClientProps) => {
  useInteractionScriptLoader({ src: scriptUrl })

  return <div id="webchat" {...vicaProps} />
}

export const VicaWidgetClient = island(
  "VicaWidgetClient",
  VicaWidgetClientComponent,
  { hydrate: "idle" },
)
