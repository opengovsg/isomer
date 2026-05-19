"use client"

import type { ZendeskWidgetProps } from "~/interfaces"
import { useInteractionScriptLoader } from "~/hooks/useInteractionScriptLoader"

// Reference: https://support.zendesk.com/hc/en-us/articles/4408839332250
export const ZendeskWidget = ({ widgetKey }: ZendeskWidgetProps) => {
  const scriptUrl = `https://static.zdassets.com/ekr/snippet.js?key=${encodeURIComponent(
    widgetKey,
  )}`

  useInteractionScriptLoader({ src: scriptUrl, id: "ze-snippet" })

  return null
}
