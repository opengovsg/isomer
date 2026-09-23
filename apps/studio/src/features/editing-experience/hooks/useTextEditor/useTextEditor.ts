import type { ControlProps } from "@jsonforms/core"
import type { Extensions, JSONContent } from "@tiptap/react"
import CharacterCount from "@tiptap/extension-character-count"
import { useEditor } from "@tiptap/react"
import TextDirection from "tiptap-text-direction"

import { BANNER_MAX_CHARACTERS } from "../../components/constants"
import {
  BASE_EXTENSIONS,
  HEADING_TYPE,
  IsomerHeading,
  createIsomerTable,
  writeTableSiteId,
  IsomerTableCell,
  IsomerTableHeader,
  PARAGRAPH_TYPE,
  PROSE_EXTENSIONS,
  TableRow,
} from "./constants"

export interface BaseEditorProps {
  data: ControlProps["data"]
  handleChange: (content: JSONContent | undefined) => void
  siteId: number
}

const useBaseEditor = ({
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

export const useTextEditor = ({ siteId, ...props }: BaseEditorProps) => {
  const editor = useBaseEditor({
    ...props,
    siteId,
    extensions: [
      ...PROSE_EXTENSIONS,
      TableRow,
      createIsomerTable(),
      IsomerTableCell,
      IsomerTableHeader,
      IsomerHeading,
    ],
  })
  writeTableSiteId(editor, siteId)
  return editor
}

export const useCalloutEditor = (props: BaseEditorProps) =>
  useBaseEditor({
    ...props,
    extensions: PROSE_EXTENSIONS,
  })

export const useAccordionEditor = ({ siteId, ...props }: BaseEditorProps) => {
  const editor = useBaseEditor({
    ...props,
    siteId,
    extensions: [
      ...PROSE_EXTENSIONS,
      TableRow,
      createIsomerTable(),
      IsomerTableCell,
      IsomerTableHeader,
    ],
  })
  writeTableSiteId(editor, siteId)
  return editor
}

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
