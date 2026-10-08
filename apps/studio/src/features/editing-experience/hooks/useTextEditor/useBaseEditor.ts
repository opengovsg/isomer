import type { Extensions } from "@tiptap/react"
import { useEditor } from "@tiptap/react"
import TextDirection from "tiptap-text-direction"

import { BASE_EXTENSIONS, HEADING_TYPE, PARAGRAPH_TYPE } from "./constants"
import { type BaseEditorProps } from "./types"

export const useBaseEditor = ({
  data,
  handleChange,
  extensions,
}: BaseEditorProps & { extensions: Extensions }) =>
  useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    extensions: [
      ...BASE_EXTENSIONS,
      ...extensions,
      TextDirection.configure({
        types: [HEADING_TYPE, PARAGRAPH_TYPE],
      }),
    ],
    // oxlint-disable-next-line @typescript-eslint/no-unsafe-assignment
    content: data,
    onUpdate: (e) => {
      const jsonContent = e.editor.getJSON()
      handleChange(jsonContent)
    },
  })

export type BaseEditorType = ReturnType<typeof useBaseEditor>
