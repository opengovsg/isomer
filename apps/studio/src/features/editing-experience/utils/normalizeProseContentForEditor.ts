import type { ControlProps } from "@jsonforms/core"
import type { JSONContent } from "@tiptap/react"

// TipTap rejects empty text nodes, so an empty paragraph has no content at all.
const EMPTY_PROSE_PARAGRAPH: JSONContent = { type: "paragraph" }

const isProseContent = (
  data: ControlProps["data"],
): data is JSONContent & { type: "prose"; content?: JSONContent[] } => {
  if (!data || typeof data !== "object" || !("type" in data)) {
    return false
  }

  return (data as { type: unknown }).type === "prose"
}

// Stored blobs commonly contain `{ type: "text", text: "" }` (e.g. empty
// paragraphs and table cells). TipTap throws on these when content checking is
// on, so drop them; a node left with no children just omits `content`. Returns
// the same reference when nothing was stripped.
const stripEmptyTextNodes = (node: JSONContent): JSONContent => {
  if (!Array.isArray(node.content)) {
    return node
  }

  const { content, ...rest } = node
  const children = content
    .filter((child) => !(child.type === "text" && child.text === ""))
    .map(stripEmptyTextNodes)
  const changed =
    children.length !== content.length ||
    children.some((child, i) => child !== content[i])

  if (!changed) {
    return node
  }

  return children.length > 0 ? { ...rest, content: children } : rest
}

export const normalizeProseContentForEditor = (
  data: ControlProps["data"],
): ControlProps["data"] => {
  if (!isProseContent(data)) {
    return data
  }

  const normalized = stripEmptyTextNodes(data)

  if (!normalized.content?.length) {
    return { ...normalized, content: [EMPTY_PROSE_PARAGRAPH] }
  }

  return normalized
}
