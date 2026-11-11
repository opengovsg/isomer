"use client"

import type { PolyglotClientProps } from "~/interfaces"
import { useInteractionScriptLoader } from "~/hooks/useInteractionScriptLoader"
import { useQueryParams } from "~/hooks/useQueryParams"

// Reference: https://polyglot.gov.sg
export const PolyglotClient = ({ scriptUrl }: PolyglotClientProps) => {
  const [queryParams] = useQueryParams()

  useInteractionScriptLoader({
    src: scriptUrl,
    timeout: queryParams.lang !== undefined ? 1 : undefined,
  })

  return <div id="polyglot-widget" />
}
