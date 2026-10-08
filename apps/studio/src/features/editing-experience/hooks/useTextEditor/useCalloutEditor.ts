import { type BaseEditorProps } from "./baseEditorTypes"
import { PROSE_EXTENSIONS } from "./constants"
import { useBaseEditor } from "./useBaseEditor"

export const useCalloutEditor = (props: BaseEditorProps) =>
  useBaseEditor({
    ...props,
    extensions: PROSE_EXTENSIONS,
  })
