import type { OrderedListProps } from "~/common"
import ContentHole from "../../tiptap/ContentHole"

const OrderedList = ({
  start,
  content,
  NodeViewWrapper = "ol",
  NodeViewContent,
}: OrderedListProps) => {
  return (
    <NodeViewWrapper as="ol" className="list-decimal ps-8 mt-6" start={start}>
      <ContentHole content={content} NodeViewContent={NodeViewContent} />
    </NodeViewWrapper>
  )
}

export default OrderedList
