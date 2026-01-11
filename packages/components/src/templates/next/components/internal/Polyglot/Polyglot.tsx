import type { PolyglotProps } from "~/interfaces"

export const Polyglot = ({ ScriptComponent = "script" }: PolyglotProps) => {
  return (
    <ScriptComponent
      type="text/javascript"
      // src="http://localhost:3001/polyglot.widget.js"
      src="https://isomer-user-content-stg.by.gov.sg/polyglot/polyglot.widget.js"
    />
  )
}
