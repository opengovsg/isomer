import type { DividerProps } from "~/common"

const Divider = ({ NodeViewWrapper = "hr" }: DividerProps) => {
  return <NodeViewWrapper as="hr" className="bg-divider-medium my-6" />
}

export default Divider
