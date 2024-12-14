import type { ControlProps } from "@jsonforms/core"
import type { Extensions, JSONContent } from "@tiptap/react"
import { useEditor } from "@tiptap/react"
import TextDirection from "tiptap-text-direction"

import {
  BASE_EXTENSIONS,
  HEADING_TYPE,
  IsomerHeading,
  IsomerTable,
  IsomerTableCell,
  IsomerTableHeader,
  PARAGRAPH_TYPE,
  TableRow,
} from "./constants"
import { isTiptapEditorEmpty } from "./isTipTapEditorEmpty"

export interface BaseEditorProps {
  data: ControlProps["data"]
  handleChange: (content: JSONContent) => void
  isRequired: boolean
}

const useBaseEditor = ({
  data,
  handleChange,
  isRequired,
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
      if (isRequired && isTiptapEditorEmpty(jsonContent)) {
        handleChange({ type: "prose" })
      } else {
        handleChange(jsonContent)
      }
    },
  })
export type BaseEditorType = ReturnType<typeof useBaseEditor>

export const useTextEditor = (props: BaseEditorProps) =>
  useBaseEditor({
    ...props,
    extensions: [
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
    extensions: [],
  })

export const useAccordionEditor = (props: BaseEditorProps) =>
  useBaseEditor({
    ...props,
    extensions: [TableRow, IsomerTable, IsomerTableCell, IsomerTableHeader],
  })

export const useProseEditor = (props: BaseEditorProps) =>
  useBaseEditor({
    ...props,
    extensions: [IsomerHeading],
  })
