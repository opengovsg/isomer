import type { ZendeskWidgetProps } from "~/interfaces"
import { useInteractionScriptLoader } from "~/hooks/useInteractionScriptLoader"
import { island } from "~/islands/island"

// Reference: https://developer.zendesk.com/documentation/classic-web-widget-sdks/web-widget/quickstart-tutorials/web-widget-javascript-apis/#adding-the-web-widget-classic-on-your-web-page
const ZendeskWidgetComponent = ({ widgetKey }: ZendeskWidgetProps) => {
  const scriptUrl = `https://static.zdassets.com/ekr/snippet.js?key=${encodeURIComponent(
    widgetKey,
  )}`

  useInteractionScriptLoader({ src: scriptUrl, id: "ze-snippet" })

  return null
}

export const ZendeskWidget = island("ZendeskWidget", ZendeskWidgetComponent, {
  hydrate: "idle",
})
