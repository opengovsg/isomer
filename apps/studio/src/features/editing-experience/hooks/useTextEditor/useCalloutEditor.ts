import { type BaseEditorProps } from "./baseEditorTypes"
import { useBaseEditor } from "./useBaseEditor"
import { PROSE_EXTENSIONS } from "./constants"

export const useCalloutEditor = (props: BaseEditorProps) =>
  useBaseEditor({
    ...props,
    extensions: PROSE_EXTENSIONS,
  })
