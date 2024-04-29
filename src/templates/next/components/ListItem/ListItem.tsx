import type { ListItemProps } from "~/common"
import ContentHole from "../../tiptap/ContentHole"

const ListItem = ({
  content,
  NodeViewWrapper = "li",
  NodeViewContent,
}: ListItemProps) => {
  return (
    <NodeViewWrapper as="li" className="[&_p]:inline pl-2 my-5">
      <ContentHole content={content} NodeViewContent={NodeViewContent} />
    </NodeViewWrapper>
  )
}

export default ListItem
