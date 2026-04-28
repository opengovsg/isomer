import type { PolyglotProps } from "~/interfaces"

export const Polyglot = ({
  ScriptComponent = "script",
  isStaging = false,
}: PolyglotProps) => {
  const host = isStaging
    ? "staging-assets.polyglot.gov.sg"
    : "assets.polyglot.gov.sg"

  return (
    <ScriptComponent
      type="text/javascript"
      src={`https://${host}/widget.js`}
    />
  )
}
