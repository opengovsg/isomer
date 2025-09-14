"use client"

import type { VicaWidgetClientProps } from "~/interfaces"
import { useInteractionScriptLoader } from "~/hooks/useInteractionScriptLoader"

export const VicaWidgetClient = ({
  environment,
  ...vicaProps
}: VicaWidgetClientProps) => {
  const scriptUrl =
    environment === "production"
      ? "https://webchat.vica.gov.sg/static/js/chat.js"
      : "https://webchat.mol-vica.com/static/js/chat.js"

  useInteractionScriptLoader({ src: scriptUrl })

  return <div id="webchat" {...vicaProps} />
}
