import type { IsoFluentProps } from "~/interfaces"

export const IsoFluent = ({ ScriptComponent = "script" }: IsoFluentProps) => {
  return (
    <ScriptComponent src="https://isofluent-test.s3.ap-southeast-1.amazonaws.com/widget.js" />
  )
}
