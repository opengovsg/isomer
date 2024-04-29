import { ParagraphProps } from "~/common"
import BaseParagraph from "../shared/Paragraph"
import { Paragraph as ParagraphStyle } from "../../typography/Paragraph"

const Paragraph = ({
  content,
  NodeViewWrapper = "div",
  NodeViewContent,
}: Pick<ParagraphProps, "content" | "NodeViewWrapper" | "NodeViewContent">) => {
  return (
    <NodeViewWrapper as="div" className="[&:not(:first-child)]:mt-6">
      <BaseParagraph
        content={content}
        NodeViewWrapper={NodeViewWrapper}
        NodeViewContent={NodeViewContent}
        className={`${ParagraphStyle[1]} text-content-strong`}
      />
    </NodeViewWrapper>
  )
}

export default Paragraph
