import type { UnorderedListProps } from "~/common"
import ContentHole from "../../tiptap/ContentHole"

const UnorderedList = ({
  content,
  NodeViewWrapper = "ul",
  NodeViewContent,
}: UnorderedListProps) => {
  return (
    <NodeViewWrapper as="ul" className="list-disc ps-8 mt-6">
      <ContentHole content={content} NodeViewContent={NodeViewContent} />
    </NodeViewWrapper>
  )
}

export default UnorderedList
