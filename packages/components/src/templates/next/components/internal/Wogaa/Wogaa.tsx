import type { WogaaProps } from "~/interfaces"

export const Wogaa = ({ ScriptComponent = "script" }: WogaaProps) => {
  return <ScriptComponent src="https://assets.wogaa.sg/scripts/wogaa.js" />
}
