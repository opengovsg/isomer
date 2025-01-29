"use client"

import type { IsoFluentProps } from "~/interfaces"

export const IsoFluent = ({ ScriptComponent = "script" }: IsoFluentProps) => {
  // to not render during static site generation on the server
  if (typeof window === "undefined") return null
  return (
    <ScriptComponent
      async
      type="text/javascript"
      src="https://isofluent-translate.hack2025.gov.sg/static/widget.iife.js"
      strategy="beforeInteractive"
    />
  )
}
