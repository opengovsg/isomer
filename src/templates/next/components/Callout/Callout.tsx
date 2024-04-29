import { CalloutProps } from "~/common"
import BaseParagraph from "../shared/Paragraph"
import { Paragraph } from "../../typography/Paragraph"

const Callout = ({
  content,
  variant,
  NodeViewWrapper = "div",
  NodeViewContent,
}: CalloutProps) => {
  return (
    <NodeViewWrapper
      as="div"
      className={`bg-utility-info-subtle p-6 border border-utility-info rounded [&:not(:first-child)]:mt-8`}
    >
      <BaseParagraph
        content={content}
        className={`text-content ${Paragraph[2]}`}
        NodeViewContent={NodeViewContent}
      />
    </NodeViewWrapper>
  )
}

export default Callout
