import type { JSONContent } from "@tiptap/react"
import {
  HEADING_TYPE,
  PARAGRAPH_TYPE,
} from "~/features/editing-experience/hooks/useTextEditor"

export const isTiptapEditorEmpty = (json?: JSONContent): boolean => {
  if (!json) {
    return true
  }
  if (json.type !== "prose") {
    return false
  }
  const { content } = json
  if (content === undefined) {
    return true
  }
  if (content.length === 0) {
    return true
  }
  if (content.length > 1) {
    return false
  }

  const { type, content: blockContent } = content[0] ?? {}
  const isTextContent = type === PARAGRAPH_TYPE || type === HEADING_TYPE
  return isTextContent ? !blockContent : false
}
