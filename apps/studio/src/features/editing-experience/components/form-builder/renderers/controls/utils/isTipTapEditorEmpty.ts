import type { JSONContent } from "@tiptap/react"
import {
  HEADING_TYPE,
  PARAGRAPH_TYPE,
} from "~/features/editing-experience/hooks/useTextEditor"
import { isDefinedNumber } from "~/utils/truthiness"

export const isTiptapEditorEmpty = (json: JSONContent | undefined): boolean => {
  if (!json) {
    return true
  }
  if (json.type !== "prose") {
    return false
  }
  if (!isDefinedNumber(json.content?.length) || json.content.length === 0) {
    return true
  }
  if (json.content.length > 1) {
    return false
  }

  const { type, content } = json.content[0] ?? {}
  const isTextContent = type === PARAGRAPH_TYPE || type === HEADING_TYPE
  return isTextContent ? !content : false
}
