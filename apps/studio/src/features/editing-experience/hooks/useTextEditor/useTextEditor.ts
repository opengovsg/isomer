import { type BaseEditorProps } from "./baseEditorTypes"
import {
  IsomerHeading,
  IsomerTable,
  IsomerTableCell,
  IsomerTableHeader,
  PROSE_EXTENSIONS,
  TableRow,
} from "./constants"
import { useBaseEditor } from "./useBaseEditor"

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
