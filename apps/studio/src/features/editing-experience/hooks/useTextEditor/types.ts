import type { ControlProps } from "@jsonforms/core"
import type { JSONContent } from "@tiptap/react"

export interface BaseEditorProps {
  data: ControlProps["data"]
  handleChange: (content: JSONContent | undefined) => void
}
