import type { PolyglotProps } from "~/interfaces"

export const Polyglot = ({ ScriptComponent = "script" }: PolyglotProps) => {
  // to not render during static site generation on the server
  if (typeof window === "undefined") return null
  return (
    <ScriptComponent
      defer
      type="text/javascript"
      src="https://isomer-user-content-stg.by.gov.sg/polyglot/polyglot.widget.js"
    />
  )
}
