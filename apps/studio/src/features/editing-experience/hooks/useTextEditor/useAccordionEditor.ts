import { type BaseEditorProps } from "./baseEditorTypes"
import {
  IsomerTable,
  IsomerTableCell,
  IsomerTableHeader,
  PROSE_EXTENSIONS,
  TableRow,
} from "./constants"
import { useBaseEditor } from "./useBaseEditor"

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
