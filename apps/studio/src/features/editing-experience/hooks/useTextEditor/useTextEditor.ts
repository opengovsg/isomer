import type { ControlProps } from "@jsonforms/core"
import type { Extensions, JSONContent } from "@tiptap/react"
import { useEditor } from "@tiptap/react"
import TextDirection from "tiptap-text-direction"

import {
  BASE_EXTENSIONS,
  BASE_PROSE_EXTENSIONS,
  HEADING_TYPE,
  IsomerHeading,
  IsomerTable,
  IsomerTableCell,
  IsomerTableHeader,
  PARAGRAPH_TYPE,
  TableRow,
} from "./constants"

export interface BaseEditorProps {
  data: ControlProps["data"]
  handleChange: (content: JSONContent | undefined) => void
}

const useBaseEditor = ({
  data,
  handleChange,
  extensions,
}: BaseEditorProps & { extensions: Extensions }) =>
  useEditor({
    immediatelyRender: false,
    extensions: [
      ...BASE_EXTENSIONS,
      ...extensions,
      TextDirection.configure({
        types: [HEADING_TYPE, PARAGRAPH_TYPE],
      }),
    ],
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
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
      ...BASE_PROSE_EXTENSIONS,
      TableRow,
      IsomerTable,
      IsomerTableCell,
      IsomerTableHeader,
      IsomerHeading,
    ],
  })

export const useCalloutEditor = (props: BaseEditorProps) =>
  useBaseEditor({
    ...props,
    extensions: BASE_PROSE_EXTENSIONS,
  })

export const useAccordionEditor = (props: BaseEditorProps) =>
  useBaseEditor({
    ...props,
    extensions: [
      ...BASE_PROSE_EXTENSIONS,
      TableRow,
      IsomerTable,
      IsomerTableCell,
      IsomerTableHeader,
    ],
  })

export const useProseEditor = (props: BaseEditorProps) =>
  useBaseEditor({
    ...props,
    extensions: [...BASE_PROSE_EXTENSIONS, IsomerHeading],
  })

// NOTE: The same for now because no extra extensions
export const useSimpleProseEditor = (props: BaseEditorProps) =>
  useBaseEditor({
    ...props,
    extensions: [],
  })
