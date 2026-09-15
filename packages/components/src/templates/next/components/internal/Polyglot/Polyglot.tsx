"use client"

import type { PolyglotProps } from "~/interfaces"
import { useInteractionScriptLoader } from "~/hooks/useInteractionScriptLoader"
import { useQueryParams } from "~/hooks/useQueryParams"

// Reference: https://polyglot.gov.sg
export const Polyglot = ({ environment }: PolyglotProps) => {
  const [queryParams] = useQueryParams()
  const scriptUrl =
    environment === "staging"
      ? "https://staging-assets.polyglot.gov.sg/widget.js"
      : "https://assets.polyglot.gov.sg/widget.js"

  useInteractionScriptLoader({
    src: scriptUrl,
    timeout: queryParams.lang !== undefined ? 500 : undefined,
  })

  return <div id="polyglot-widget" />
}
