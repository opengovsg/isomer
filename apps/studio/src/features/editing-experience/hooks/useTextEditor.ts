import type { ControlProps } from "@jsonforms/core"
import type { Extensions, JSONContent } from "@tiptap/react"
import TableRow from "@tiptap/extension-table-row"
import { useEditor } from "@tiptap/react"
import TextDirection from "tiptap-text-direction"

import {
  BASE_EXTENSIONS,
  IsomerHeading,
  IsomerTable,
  IsomerTableCell,
  IsomerTableHeader,
} from "../constants"

export interface BaseEditorProps {
  data: ControlProps["data"]
  handleChange: (content: JSONContent) => void
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
        types: ["heading", "paragraph"],
      }),
    ],
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    content: data,
    onUpdate: (e) => {
      const jsonContent = e.editor.getJSON()
      handleChange(jsonContent)
    },
  })

export const useTextEditor = ({ data, handleChange }: BaseEditorProps) =>
  useBaseEditor({
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    data,
    handleChange,
    extensions: [
      TableRow,
      IsomerTable,
      IsomerTableCell,
      IsomerTableHeader,
      IsomerHeading,
    ],
  })

export const useCalloutEditor = ({ data, handleChange }: BaseEditorProps) => {
  return useBaseEditor({
    extensions: [],
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    data,
    handleChange,
  })
}

export const useAccordionEditor = ({ data, handleChange }: BaseEditorProps) => {
  return useBaseEditor({
    extensions: [TableRow, IsomerTable, IsomerTableCell, IsomerTableHeader],
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    data,
    handleChange,
  })
}

export const useProseEditor = ({ data, handleChange }: BaseEditorProps) =>
  useBaseEditor({
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    data,
    handleChange,
    extensions: [IsomerHeading],
  })
