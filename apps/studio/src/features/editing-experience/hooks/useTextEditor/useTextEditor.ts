import type { ControlProps } from "@jsonforms/core"
import type { Extensions, JSONContent } from "@tiptap/react"
import CharacterCount from "@tiptap/extension-character-count"
import { Document } from "@tiptap/extension-document"
import { useEditor } from "@tiptap/react"
import TextDirection from "tiptap-text-direction"

import { BANNER_MAX_CHARACTERS } from "../../components/constants"
import {
  BASE_EXTENSIONS,
  HEADING_TYPE,
  IsomerHeading,
  IsomerTable,
  IsomerTableCell,
  IsomerTableHeader,
  PARAGRAPH_TYPE,
  PROSE_EXTENSIONS,
  TableRow,
} from "./constants"

export interface BaseEditorProps {
  data: ControlProps["data"]
  handleChange: (content: JSONContent | undefined) => void
}

// One table and nothing else, so the focused modal cannot grow into a document.
const TABLE_ONLY_DOCUMENT = Document.extend({
  name: "prose",
  content: "table",
})

const TABLE_FOCUS_BASE_EXTENSIONS: Extensions = [
  TABLE_ONLY_DOCUMENT,
  ...BASE_EXTENSIONS.filter((extension) => extension.name !== "prose"),
]

const useBaseEditor = ({
  data,
  handleChange,
  extensions,
  baseExtensions = BASE_EXTENSIONS,
}: BaseEditorProps & { extensions: Extensions; baseExtensions?: Extensions }) =>
  useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    extensions: [
      ...baseExtensions,
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

export const useTextEditor = (props: BaseEditorProps) =>
  useBaseEditor({
    ...props,
    extensions: [
      ...PROSE_EXTENSIONS,
      TableRow,
      IsomerTable,
      IsomerTableCell,
      IsomerTableHeader,
      IsomerHeading,
    ],
  })

export const useTableFocusEditor = (props: BaseEditorProps) =>
  useBaseEditor({
    ...props,
    baseExtensions: TABLE_FOCUS_BASE_EXTENSIONS,
    extensions: [
      ...PROSE_EXTENSIONS,
      TableRow,
      IsomerTable.configure({ focusEdit: true }),
      IsomerTableCell,
      IsomerTableHeader,
    ],
  })

export const useCalloutEditor = (props: BaseEditorProps) =>
  useBaseEditor({
    ...props,
    extensions: PROSE_EXTENSIONS,
  })

export const useAccordionEditor = (props: BaseEditorProps) =>
  useBaseEditor({
    ...props,
    extensions: [
      ...PROSE_EXTENSIONS,
      TableRow,
      IsomerTable,
      IsomerTableCell,
      IsomerTableHeader,
    ],
  })

export const useProseEditor = (props: BaseEditorProps) =>
  useBaseEditor({
    ...props,
    extensions: [...PROSE_EXTENSIONS, IsomerHeading],
  })

// NOTE: The same for now because no extra extensions
export const useSimpleProseEditor = (props: BaseEditorProps) =>
  useBaseEditor({
    ...props,
    extensions: [CharacterCount.configure({ limit: BANNER_MAX_CHARACTERS })],
  })
