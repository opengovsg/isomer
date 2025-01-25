import type { IsoFluentProps } from "~/interfaces"

export const IsoFluent = ({ ScriptComponent = "script" }: IsoFluentProps) => {
  return <ScriptComponent src="http://localhost:59384/scripts/widget.js" />
}
