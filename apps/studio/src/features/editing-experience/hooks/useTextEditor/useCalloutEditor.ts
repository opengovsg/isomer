import { type BaseEditorProps, useBaseEditor } from "./baseEditor"
import { PROSE_EXTENSIONS } from "./constants"

export const useCalloutEditor = (props: BaseEditorProps) =>
  useBaseEditor({
    ...props,
    extensions: PROSE_EXTENSIONS,
  })
