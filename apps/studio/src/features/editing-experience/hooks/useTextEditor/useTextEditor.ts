import { type BaseEditorProps, useBaseEditor } from "./baseEditor"
import {
  IsomerHeading,
  IsomerTable,
  IsomerTableCell,
  IsomerTableHeader,
  PROSE_EXTENSIONS,
  TableRow,
} from "./constants"

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
