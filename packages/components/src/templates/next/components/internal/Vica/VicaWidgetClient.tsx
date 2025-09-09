"use client"

import type { VicaWidgetClientProps } from "~/interfaces"

export const VicaWidgetClient = ({
  environment,
  ScriptComponent,
  ...vicaProps
}: VicaWidgetClientProps) => {
  const scriptUrl =
    environment === "production"
      ? "https://webchat.vica.gov.sg/static/js/chat.js"
      : "https://webchat.mol-vica.com/static/js/chat.js"

  return (
    <>
      {/* Next.js lazyOnload behaviour (as recommended for widgets) */}
      <ScriptComponent src={scriptUrl} strategy="lazyOnload" />
      <div id="webchat" {...vicaProps} />
    </>
  )
}
