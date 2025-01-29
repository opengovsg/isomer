import type { IsoFluentProps } from "~/interfaces"

export const IsoFluent = ({ ScriptComponent = "script" }: IsoFluentProps) => {
  return (
    <ScriptComponent src="https://isofluent-translate.hack2025.gov.sg/static/widget.iife.js" />
  )
}
