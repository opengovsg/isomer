"use client"

import type { VicaWidgetClientProps } from "~/interfaces"
import { useInteractionScriptLoader } from "~/hooks/useInteractionScriptLoader"

export const VicaWidgetClient = ({
  useDevStagingScript,
  ...vicaProps
}: VicaWidgetClientProps) => {
  const scriptUrl = useDevStagingScript
    ? "https://webchat.mol-vica.com/static/js/chat.js"
    : "https://webchat.vica.gov.sg/static/js/chat.js"

  useInteractionScriptLoader({ src: scriptUrl })

  return <div id="webchat" {...vicaProps} />
}
