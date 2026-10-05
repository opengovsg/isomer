import type { ControlProps } from "@jsonforms/core"
import type { JSONContent } from "@tiptap/react"

const EMPTY_PROSE_PARAGRAPH: JSONContent = {
  type: "paragraph",
  content: [{ type: "text", text: "" }],
}

const isProseContent = (
  data: ControlProps["data"],
): data is JSONContent & { type: "prose"; content?: JSONContent[] } => {
  if (!data || typeof data !== "object" || !("type" in data)) {
    return false
  }

  return (data as { type: unknown }).type === "prose"
}

export const normalizeProseContentForEditor = (
  data: ControlProps["data"],
): ControlProps["data"] => {
  if (!isProseContent(data)) {
    return data
  }

  const content = Array.isArray(data.content) ? data.content : []

  if (content.length === 0) {
    return {
      ...data,
      content: [EMPTY_PROSE_PARAGRAPH],
    }
  }

  return data
}
