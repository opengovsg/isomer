import type { JSONContent } from "@tiptap/react"

import { HEADING_TYPE, PARAGRAPH_TYPE } from "./constants"

export const isTiptapEditorEmpty = (json: JSONContent): boolean => {
  if (json.type !== "prose") return false // fail-safe check: it should always be prose type
  if (!json.content?.length) return true
  if (json.content.length > 1) return false

  const { type, content } = json.content[0] ?? {}
  const isTextContent = type === PARAGRAPH_TYPE || type === HEADING_TYPE
  return isTextContent ? !content : false
}
