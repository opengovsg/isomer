import { type BaseEditorProps } from "./baseEditorTypes"
import { IsomerHeading, PROSE_EXTENSIONS } from "./constants"
import { useBaseEditor } from "./useBaseEditor"

export const useProseEditor = (props: BaseEditorProps) =>
  useBaseEditor({
    ...props,
    extensions: [...PROSE_EXTENSIONS, IsomerHeading],
  })
