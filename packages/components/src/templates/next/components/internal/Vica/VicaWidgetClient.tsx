"use client"

import type { VicaWidgetClientProps } from "~/interfaces"

export const VicaWidgetClient = ({
  ScriptComponent,
  useDevStagingScript,
  ...vicaProps
}: VicaWidgetClientProps) => {
  const scriptUrl = useDevStagingScript
    ? "https://webchat.mol-vica.com/static/js/chat.js"
    : "https://webchat.vica.gov.sg/static/js/chat.js"

  return (
    <>
      <ScriptComponent src={scriptUrl} strategy="lazyOnload" />
      <div id="webchat" {...vicaProps} />
    </>
  )
}
