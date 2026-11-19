import type { PolyglotClientProps } from "~/interfaces"
import { useInteractionScriptLoader } from "~/hooks/useInteractionScriptLoader"
import { useQueryParams } from "~/hooks/useQueryParams"
import { island } from "~/islands/island"

// Reference: https://polyglot.gov.sg
const PolyglotClientComponent = ({ scriptUrl }: PolyglotClientProps) => {
  const [queryParams] = useQueryParams()

  useInteractionScriptLoader({
    src: scriptUrl,
    timeout: queryParams.lang !== undefined ? 1 : undefined,
  })

  return <div id="polyglot-widget" />
}

export const PolyglotClient = island(
  "PolyglotClient",
  PolyglotClientComponent,
  { hydrate: "load" },
)
