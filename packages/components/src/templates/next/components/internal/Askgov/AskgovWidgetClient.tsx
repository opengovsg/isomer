"use client"

import type { AskgovWidgetClientProps } from "~/interfaces"
import { useInteractionScriptLoader } from "~/hooks/useInteractionScriptLoader"

// Reference: https://github.com/opengovsg/askgov-next/tree/main/apps/widget
export const AskgovWidgetClient = ({
  scriptUrl,
  ...askgovProps
}: AskgovWidgetClientProps) => {
  useInteractionScriptLoader({ src: scriptUrl })

  return <div id="askgov-widget" {...askgovProps} />
}
