import { PROSE_EXTENSIONS } from "./constants"
import { type BaseEditorProps } from "./types"
import { useBaseEditor } from "./useBaseEditor"

export const useCalloutEditor = (props: BaseEditorProps) =>
  useBaseEditor({
    ...props,
    extensions: PROSE_EXTENSIONS,
  })
