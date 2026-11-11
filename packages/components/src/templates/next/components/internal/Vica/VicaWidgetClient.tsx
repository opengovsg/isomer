"use client"

import type { VicaWidgetClientProps } from "~/interfaces"
import { useInteractionScriptLoader } from "~/hooks/useInteractionScriptLoader"

export const VicaWidgetClient = ({
  scriptUrl,
  ...vicaProps
}: VicaWidgetClientProps) => {
  useInteractionScriptLoader({ src: scriptUrl })

  return <div id="webchat" {...vicaProps} />
}
