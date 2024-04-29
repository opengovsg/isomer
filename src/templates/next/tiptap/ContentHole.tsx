import type { IsomerComponent } from "~/types"
import { renderComponent } from "../layouts"

interface ContentHoleProps {
  content: IsomerComponent[]
  NodeViewContent?: any
  LinkComponent?: any
  ScriptComponent?: any
}

const ContentHole = ({
  content,
  NodeViewContent,
  LinkComponent,
  ScriptComponent,
}: ContentHoleProps) => {
  if (!NodeViewContent) {
    return content.map((component) =>
      renderComponent({ component, LinkComponent, ScriptComponent }),
    )
  }

  return <NodeViewContent />
}

export default ContentHole
